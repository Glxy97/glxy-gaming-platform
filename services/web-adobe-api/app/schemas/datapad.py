"""Schemas for DataPad integration endpoints."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class DataPadFieldType(str, Enum):
    """Supported DataPad field types."""

    text = "text"
    textarea = "textarea"
    number = "number"
    email = "email"
    phone = "phone"
    date = "date"
    checkbox = "checkbox"
    radio = "radio"
    select = "select"
    signature = "signature"
    file = "file"


class SyncStatus(str, Enum):
    """Status of sync operation."""

    pending = "pending"
    syncing = "syncing"
    synced = "synced"
    error = "error"
    conflict = "conflict"


class DataPadField(BaseModel):
    """DataPad field representation."""

    id: str
    label: str
    field_type: DataPadFieldType
    group: Optional[str] = None
    required: bool = False
    default_value: Optional[str] = None
    validation_rules: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class DataPadFieldCreate(BaseModel):
    """Schema for creating a new DataPad field."""

    label: str = Field(..., min_length=1, max_length=255)
    field_type: DataPadFieldType
    group: Optional[str] = Field(None, max_length=100)
    required: bool = False
    default_value: Optional[str] = None
    validation_rules: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class DataPadFieldUpdate(BaseModel):
    """Schema for updating a DataPad field (partial)."""

    label: Optional[str] = Field(None, min_length=1, max_length=255)
    field_type: Optional[DataPadFieldType] = None
    group: Optional[str] = Field(None, max_length=100)
    required: Optional[bool] = None
    default_value: Optional[str] = None
    validation_rules: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class DataPadFieldList(BaseModel):
    """List of DataPad fields with pagination."""

    items: List[DataPadField]
    total: Optional[int] = None
    page: Optional[int] = None
    page_size: Optional[int] = None


class DataPadMapping(BaseModel):
    """Mapping between PDF field and DataPad field."""

    id: str
    pdf_field_id: int
    datapad_field_id: str
    document_id: Optional[int] = None
    status: SyncStatus = SyncStatus.pending
    last_synced_at: Optional[datetime] = None
    sync_error: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class DataPadMappingCreate(BaseModel):
    """Schema for creating a field mapping."""

    pdf_field_id: int
    datapad_field_id: str
    document_id: Optional[int] = None


class DataPadSyncPayload(BaseModel):
    """Payload for sync request."""

    form_id: int
    field_ids: List[int] = Field(default_factory=list, description="Specific field IDs to sync, empty = all")
    force: bool = Field(default=False, description="Force sync even if already synced")
    conflict_resolution: str = Field(
        default="skip",
        pattern="^(skip|overwrite|merge)$",
        description="How to handle conflicts",
    )


class DataPadSyncResult(BaseModel):
    """Result of a single field sync."""

    field_id: int
    status: SyncStatus
    datapad_field_id: Optional[str] = None
    error_message: Optional[str] = None
    synced_at: Optional[datetime] = None


class DataPadSyncResponse(BaseModel):
    """Response from sync operation."""

    form_id: int
    status: SyncStatus
    results: List[DataPadSyncResult]
    summary: Dict[str, int] = Field(
        default_factory=dict,
        description="Summary counts: synced, pending, failed, skipped",
    )
    message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class DataPadSyncStatusResponse(BaseModel):
    """Current sync status for a form."""

    form_id: int
    status: SyncStatus
    total_fields: int
    synced_fields: int
    pending_fields: int
    failed_fields: int
    last_sync_at: Optional[datetime] = None
    error_count: int = 0
    errors: List[str] = Field(default_factory=list)


class DataPadHealthResponse(BaseModel):
    """Health check response."""

    status: str
    api_available: bool
    authenticated: bool
    rate_limit_remaining: Optional[int] = None
    rate_limit_reset: Optional[int] = None
    details: Optional[Dict[str, Any]] = None


class DataPadErrorResponse(BaseModel):
    """Standardized error response."""

    error: str
    message: str
    status_code: int
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
