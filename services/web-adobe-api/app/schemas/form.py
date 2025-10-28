"""Pydantic schemas for PDF form resources."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.form import PdfDocumentStatus, PdfFieldStatus


class FormFieldBase(BaseModel):
    """Base schema for PDF field data."""
    pdf_name: str = Field(..., description="Name of the PDF form field")
    display_label: Optional[str] = Field(None, description="Label shown in the app")
    group_name: Optional[str] = Field(None, description="Logical group")
    field_type: str = Field("text", description="Field type (text, checkbox, select, signature)")
    required: bool = False
    validation_pattern: Optional[str] = None
    datapad_field_id: Optional[str] = None
    suggestions: Optional[str] = None  # JSON string

    # Position data (normalized 0-1)
    x: float = 0.0
    y: float = 0.0
    width: float = 0.0
    height: float = 0.0
    page_number: int = Field(1, ge=1, description="Page number in PDF")

    status: PdfFieldStatus = PdfFieldStatus.DRAFT


class FormFieldCreate(FormFieldBase):
    """Schema for creating a new PDF field."""
    pass


class FormFieldUpdate(BaseModel):
    """Schema for updating existing PDF field."""
    display_label: Optional[str] = None
    group_name: Optional[str] = None
    field_type: Optional[str] = None
    required: Optional[bool] = None
    validation_pattern: Optional[str] = None
    datapad_field_id: Optional[str] = None
    status: Optional[PdfFieldStatus] = None


class FormFieldRead(FormFieldBase):
    """Schema for reading PDF field data."""
    id: str
    document_id: str
    updated_at: datetime

    class Config:
        from_attributes = True  # Pydantic v2


class FormBase(BaseModel):
    """Base schema for PDF document."""
    title: str = Field(..., min_length=1, max_length=255)


class FormCreate(FormBase):
    """Schema for creating a new PDF document."""
    user_id: str
    filename: str
    storage_path: str
    checksum: Optional[str] = None
    page_count: Optional[int] = None
    file_size: Optional[int] = None


class FormRead(FormBase):
    """Schema for reading PDF document data."""
    id: str
    user_id: str
    filename: str
    storage_path: str
    status: PdfDocumentStatus
    checksum: Optional[str] = None
    page_count: Optional[int] = None
    file_size: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Pydantic v2


class FormDetail(FormRead):
    """Schema for PDF document with all fields."""
    fields: List[FormFieldRead] = []


class FormList(BaseModel):
    """Schema for paginated list of PDF documents."""
    items: List[FormRead]
    total: int
    skip: int = 0
    limit: int = 20


class UploadResponse(BaseModel):
    """Response schema for successful PDF upload."""
    document: FormRead
    detail: str = "Upload successful"


class AnalyzeRequest(BaseModel):
    """Request schema for PDF analysis."""
    async_mode: bool = Field(True, description="Run analysis in background")
    use_ocr: bool = Field(True, description="Enable OCR fallback")
    use_ai: bool = Field(False, description="Use AI for label suggestions")


class AnalyzeResult(BaseModel):
    """Response schema for PDF analysis."""
    message: str
    field_count: int
    status: PdfDocumentStatus
    document_id: str


class SyncRequest(BaseModel):
    """Request schema for DataPad sync."""
    field_ids: List[str] = Field(..., min_length=1)


class SyncResult(BaseModel):
    """Response schema for DataPad sync."""
    synced: List[str]
    failed: List[str]
    message: Optional[str] = None


class AISuggestionRequest(BaseModel):
    """Request schema for AI label suggestions."""
    field_names: List[str] = Field(..., min_length=1, max_length=100)
    provider: Optional[str] = Field(None, description="Override AI provider")


class AISuggestionResponse(BaseModel):
    """Response schema for AI suggestions."""
    suggestions: List[FormFieldUpdate]
    provider: str
