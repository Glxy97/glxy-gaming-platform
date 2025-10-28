"""Routes for PDF form management."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from sqlmodel import Session, select, func

from app.api.dependencies import get_db_session, get_settings, get_storage, get_pdf_service, get_ai_service
from app.core.config import Settings
from app.core.logging import get_logger
from app.models.form import PdfDocument, PdfField, PdfDocumentStatus, PdfFieldStatus
from app.schemas.form import (
    FormCreate,
    FormRead,
    FormDetail,
    FormList,
    FormFieldRead,
    FormFieldUpdate,
    UploadResponse,
    AnalyzeRequest,
    AnalyzeResult,
    SyncRequest,
    SyncResult,
    AISuggestionRequest,
    AISuggestionResponse,
)
from app.services.storage_service import StorageService
from app.services.pdf_service import PDFAnalysisService
from app.services.ai_service import AIService

logger = get_logger(__name__)
router = APIRouter(prefix="/forms", tags=["forms"])


@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_pdf_form(
    background: BackgroundTasks,
    file: UploadFile = File(..., description="PDF file to upload"),
    title: str = Form(..., min_length=1, max_length=255),
    user_id: str = Form(..., description="User ID from authentication"),
    auto_analyze: bool = Form(False, description="Automatically start analysis"),
    session: Session = Depends(get_db_session),
    storage: StorageService = Depends(get_storage),
    pdf_service: PDFAnalysisService = Depends(get_pdf_service),
) -> UploadResponse:
    """
    Upload a PDF form document.

    - Validates PDF format and size
    - Computes SHA256 checksum
    - Stores file in user-specific directory
    - Creates database record
    - Optionally triggers background analysis
    """
    logger.info(f"Upload request received", filename=file.filename, user_id=user_id)

    # Validate file
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required"
        )

    # Read file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset

    storage.validate_pdf(file.filename, file_size)

    # Save file
    try:
        saved_path, actual_size = storage.save_upload(file.filename, file.file, user_id)
    except Exception as e:
        logger.error(f"Upload failed: {e}", filename=file.filename)
        raise

    # Compute checksum and extract metadata
    try:
        checksum = pdf_service.compute_checksum(saved_path)
        metadata = pdf_service.get_pdf_metadata(saved_path)

        # Create database record
        document = PdfDocument(
            user_id=user_id,
            title=title,
            filename=file.filename,
            storage_path=str(saved_path),
            status=PdfDocumentStatus.DRAFT,
            checksum=checksum,
            page_count=metadata.get("page_count"),
            file_size=actual_size,
        )

        session.add(document)
        session.commit()
        session.refresh(document)

        logger.info(
            "PDF document created",
            document_id=document.id,
            pages=document.page_count,
            checksum=checksum[:16]
        )

        # Trigger background analysis if requested
        if auto_analyze:
            from app.worker.tasks import analyze_pdf_task
            background.add_task(analyze_pdf_task, document.id)
            logger.info(f"Background analysis queued", document_id=document.id)

        return UploadResponse(
            document=FormRead.model_validate(document),
            detail="Upload successful" + (" - Analysis queued" if auto_analyze else "")
        )

    except Exception as e:
        # Clean up file on database error
        storage.delete_document_files(str(saved_path))
        logger.error(f"Database error during upload: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create document record"
        )


@router.get("/", response_model=FormList)
def list_pdf_documents(
    user_id: Optional[str] = None,
    status_filter: Optional[PdfDocumentStatus] = None,
    skip: int = 0,
    limit: int = 20,
    session: Session = Depends(get_db_session),
) -> FormList:
    """
    List PDF documents with optional filters.

    - Supports pagination (skip/limit)
    - Filter by user_id
    - Filter by status
    """
    query = select(PdfDocument)

    if user_id:
        query = query.where(PdfDocument.user_id == user_id)

    if status_filter:
        query = query.where(PdfDocument.status == status_filter)

    # Count total
    count_query = select(func.count()).select_from(PdfDocument)
    if user_id:
        count_query = count_query.where(PdfDocument.user_id == user_id)
    if status_filter:
        count_query = count_query.where(PdfDocument.status == status_filter)

    total = session.exec(count_query).one()

    # Get paginated results
    query = query.offset(skip).limit(limit).order_by(PdfDocument.created_at.desc())
    documents = session.exec(query).all()

    return FormList(
        items=[FormRead.model_validate(doc) for doc in documents],
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/{document_id}", response_model=FormDetail)
def get_pdf_document(
    document_id: str,
    session: Session = Depends(get_db_session),
) -> FormDetail:
    """Get PDF document with all fields."""
    document = session.get(PdfDocument, document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    return FormDetail.model_validate(document)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_pdf_document(
    document_id: str,
    session: Session = Depends(get_db_session),
    storage: StorageService = Depends(get_storage),
) :
    """Delete PDF document and associated files."""
    document = session.get(PdfDocument, document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Delete physical file
    storage.delete_document_files(document.storage_path)

    # Delete database record (cascades to fields)
    session.delete(document)
    session.commit()

    logger.info(f"Document deleted", document_id=document_id)


@router.post("/{document_id}/analyze", response_model=AnalyzeResult)
async def analyze_pdf_document(
    document_id: str,
    request: AnalyzeRequest = AnalyzeRequest(),
    background: BackgroundTasks = BackgroundTasks(),
    session: Session = Depends(get_db_session),
    pdf_service: PDFAnalysisService = Depends(get_pdf_service),
    ai_service: AIService = Depends(get_ai_service),
) -> AnalyzeResult:
    """
    Analyze PDF and extract form fields.

    - Extracts interactive form fields via PyMuPDF
    - Falls back to OCR if no form fields found
    - Optionally uses AI for label suggestions
    - Can run synchronously or in background
    """
    document = session.get(PdfDocument, document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    if document.status == PdfDocumentStatus.ANALYZING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Document is already being analyzed"
        )

    # Queue background analysis
    if request.async_mode:
        document.status = PdfDocumentStatus.ANALYZING
        session.add(document)
        session.commit()

        from app.worker.tasks import analyze_pdf_task
        background.add_task(analyze_pdf_task, document_id, request.use_ai)

        return AnalyzeResult(
            message="Analysis queued",
            field_count=0,
            status=PdfDocumentStatus.ANALYZING,
            document_id=document_id
        )

    # Synchronous analysis
    try:
        document.status = PdfDocumentStatus.ANALYZING
        session.add(document)
        session.commit()

        pdf_path = Path(document.storage_path)

        # Extract fields
        fields = pdf_service.extract_fields(pdf_path)

        # Apply AI suggestions if requested
        if request.use_ai and fields:
            suggestions = await ai_service.suggest_labels(fields)
            for idx, suggestion in enumerate(suggestions):
                if idx < len(fields):
                    # Update field with AI suggestions
                    for key, value in suggestion.model_dump(exclude_unset=True).items():
                        setattr(fields[idx], key, value)

        # Save fields to database
        field_count = 0
        for field_data in fields:
            field = PdfField(
                document_id=document_id,
                pdf_name=field_data.pdf_name,
                display_label=field_data.display_label,
                group_name=field_data.group_name,
                field_type=field_data.field_type,
                required=field_data.required,
                validation_pattern=field_data.validation_pattern,
                x=field_data.x,
                y=field_data.y,
                width=field_data.width,
                height=field_data.height,
                page_number=field_data.page_number,
                status=PdfFieldStatus.PENDING_REVIEW,
            )
            session.add(field)
            field_count += 1

        document.status = PdfDocumentStatus.REVIEW
        session.add(document)
        session.commit()

        logger.info(
            "PDF analysis complete",
            document_id=document_id,
            field_count=field_count
        )

        return AnalyzeResult(
            message=f"Analysis complete - {field_count} fields extracted",
            field_count=field_count,
            status=PdfDocumentStatus.REVIEW,
            document_id=document_id
        )

    except Exception as e:
        document.status = PdfDocumentStatus.ERROR
        session.add(document)
        session.commit()
        logger.error(f"Analysis error: {e}", document_id=document_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@router.get("/{document_id}/fields", response_model=list[FormFieldRead])
def list_document_fields(
    document_id: str,
    status_filter: Optional[PdfFieldStatus] = None,
    session: Session = Depends(get_db_session),
) -> list[FormFieldRead]:
    """List all fields for a PDF document."""
    # Verify document exists
    document = session.get(PdfDocument, document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    query = select(PdfField).where(PdfField.document_id == document_id)

    if status_filter:
        query = query.where(PdfField.status == status_filter)

    query = query.order_by(PdfField.page_number, PdfField.y)
    fields = session.exec(query).all()

    return [FormFieldRead.model_validate(field) for field in fields]


@router.patch("/fields/{field_id}", response_model=FormFieldRead)
def update_pdf_field(
    field_id: str,
    update: FormFieldUpdate,
    session: Session = Depends(get_db_session),
) -> FormFieldRead:
    """Update PDF field metadata."""
    field = session.get(PdfField, field_id)
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )

    # Update fields
    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(field, key, value)

    from datetime import datetime
    field.updated_at = datetime.utcnow()

    session.add(field)
    session.commit()
    session.refresh(field)

    logger.info(f"Field updated", field_id=field_id, updates=list(update_data.keys()))

    return FormFieldRead.model_validate(field)


@router.post("/{document_id}/status", response_model=FormRead)
def update_document_status(
    document_id: str,
    new_status: PdfDocumentStatus,
    session: Session = Depends(get_db_session),
) -> FormRead:
    """Update document status."""
    document = session.get(PdfDocument, document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    document.status = new_status
    from datetime import datetime
    document.updated_at = datetime.utcnow()

    session.add(document)
    session.commit()
    session.refresh(document)

    logger.info(f"Document status updated", document_id=document_id, status=new_status)

    return FormRead.model_validate(document)
