"""Domain logic for form management."""

from __future__ import annotations

from pathlib import Path
from typing import Iterable, List, Tuple

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlmodel import Session, select

from app.models import PdfDocument, PdfField, PdfDocumentStatus
from app.schemas import (
    FormCreate,
    FormFieldCreate,
    FormFieldUpdate,
)
from app.services.ai_service import AIService
from app.services.pdf_service import PDFAnalysisService
from app.services.storage_service import StorageService


class FormService:
    def __init__(
        self,
        session: Session,
        storage: StorageService,
        pdf_service: PDFAnalysisService,
        ai_service: AIService,
    ) -> None:
        self.session = session
        self.storage = storage
        self.pdf_service = pdf_service
        self.ai_service = ai_service

    def list_forms(self, skip: int = 0, limit: int = 20) -> Tuple[List[PdfDocument], int]:
        query = select(PdfDocument).offset(skip).limit(limit)
        forms = self.session.exec(query).all()
        total = self.session.exec(select(func.count()).select_from(PdfDocument)).one()[0]
        return forms, int(total)

    def create_form(self, data: FormCreate) -> PdfDocument:
        form = PdfDocument(
            user_id=data.user_id,
            title=data.title,
            filename=data.filename,
            storage_path=data.storage_path,
            status=PdfDocumentStatus.DRAFT,
            checksum=data.checksum,
            page_count=data.page_count,
            file_size=data.file_size,
        )
        self.session.add(form)
        self.session.commit()
        self.session.refresh(form)
        return form

    def get_form(self, form_id: str) -> PdfDocument:
        form = self.session.get(PdfDocument, form_id)
        if not form:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")
        return form

    def add_fields(self, form: PdfDocument, fields: Iterable[FormFieldCreate]) -> List[PdfField]:
        created: List[PdfField] = []
        for field in fields:
            entity = PdfField(
                document_id=form.id,
                pdf_name=field.pdf_name,
                display_label=field.display_label,
                group_name=field.group_name,
                field_type=field.field_type,
                required=field.required,
                validation_pattern=field.validation_pattern,
                datapad_field_id=field.datapad_field_id,
                suggestions=field.suggestions,
                x=field.x,
                y=field.y,
                width=field.width,
                height=field.height,
                page_number=field.page_number,
            )
            self.session.add(entity)
            created.append(entity)
        self.session.commit()
        for entity in created:
            self.session.refresh(entity)
        return created

    def update_field(self, field_id: str, patch: FormFieldUpdate) -> PdfField:
        field = self.session.get(PdfField, field_id)
        if not field:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Field not found")
        for key, value in patch.dict(exclude_unset=True).items():
            setattr(field, key, value)
        self.session.add(field)
        self.session.commit()
        self.session.refresh(field)
        return field

    def analyze_form(self, form: PdfDocument) -> List[PdfField]:
        pdf_path = Path(form.storage_path)
        faux_fields = self.pdf_service.extract_fields(pdf_path)
        suggestions = self.ai_service.suggest_labels(faux_fields)
        for idx, suggestion in enumerate(suggestions):
            faux_fields[idx] = faux_fields[idx].copy(update=suggestion.dict(exclude_unset=True))
        return self.add_fields(form, faux_fields)