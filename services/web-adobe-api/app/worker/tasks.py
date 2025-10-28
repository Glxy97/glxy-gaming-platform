"""Celery task definitions for background processing."""

from __future__ import annotations

from pathlib import Path

from sqlmodel import Session

from app.core.config import get_settings
from app.core.database import engine
from app.core.logging import get_logger
from app.models.form import PdfDocument, PdfField, PdfDocumentStatus, PdfFieldStatus
from app.services.ai_service import AIService
from app.services.pdf_service import PDFAnalysisService

logger = get_logger(__name__)


def analyze_pdf_task(document_id: str, use_ai: bool = False) -> int:
    """
    Background task to analyze PDF and extract fields.

    This is called from BackgroundTasks, not Celery.
    For true async processing, implement Celery integration.
    """
    settings = get_settings()
    pdf_service = PDFAnalysisService(settings)
    ai_service = AIService(settings)

    with Session(engine) as session:
        try:
            document = session.get(PdfDocument, document_id)
            if not document:
                logger.error(f"Document not found", document_id=document_id)
                return 0

            document.status = PdfDocumentStatus.ANALYZING
            session.add(document)
            session.commit()

            # Extract fields from PDF
            pdf_path = Path(document.storage_path)
            fields = pdf_service.extract_fields(pdf_path)

            logger.info(
                f"Extracted fields from PDF",
                document_id=document_id,
                field_count=len(fields)
            )

            # Apply AI suggestions if requested
            if use_ai and fields:
                import asyncio
                suggestions = asyncio.run(ai_service.suggest_labels(fields))
                for idx, suggestion in enumerate(suggestions):
                    if idx < len(fields):
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
                f"PDF analysis complete",
                document_id=document_id,
                field_count=field_count
            )

            return field_count

        except Exception as e:
            logger.error(f"Analysis task error: {e}", document_id=document_id)
            document = session.get(PdfDocument, document_id)
            if document:
                document.status = PdfDocumentStatus.ERROR
                session.add(document)
                session.commit()
            return 0
