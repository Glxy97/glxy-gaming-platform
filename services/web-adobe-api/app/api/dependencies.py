"""Shared API dependencies and utilities."""

from __future__ import annotations

from fastapi import Depends, Header, HTTPException, status
from sqlmodel import Session

from app.core.config import Settings, get_settings
from app.core.database import get_session
from app.services.ai_service import AIService
from app.services.datapad_client import DataPadClient
from app.services.pdf_service import PDFAnalysisService
from app.services.storage_service import StorageService
from app.services.sync_service import SyncService


def get_db_session() -> Session:
    """Alias for get_session for consistency."""
    return next(get_session())


def get_optional_api_key(
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
    settings: Settings = Depends(get_settings),
) -> str | None:
    """Return API key header if provided and registered in settings."""
    if not x_api_key:
        return None
    if x_api_key not in settings.allowed_api_keys:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key provided.",
        )
    return x_api_key


def get_storage(settings: Settings = Depends(get_settings)) -> StorageService:
    """Get storage service instance."""
    return StorageService(settings)


def get_pdf_service(settings: Settings = Depends(get_settings)) -> PDFAnalysisService:
    """Get PDF analysis service instance."""
    return PDFAnalysisService(settings)


def get_ai_service(settings: Settings = Depends(get_settings)) -> AIService:
    """Get AI service instance."""
    return AIService(settings)


def get_datapad_client(settings: Settings = Depends(get_settings)) -> DataPadClient:
    """Get DataPad client instance."""
    return DataPadClient(settings)


def get_sync_service(
    settings: Settings = Depends(get_settings),
    datapad: DataPadClient = Depends(get_datapad_client),
    db: Session = Depends(get_db_session),
) -> SyncService:
    """Get synchronization service instance."""
    return SyncService(settings, datapad, db)
