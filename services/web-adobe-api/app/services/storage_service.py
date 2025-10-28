"""File storage helpers with validation."""

from __future__ import annotations

import shutil
from pathlib import Path
from typing import BinaryIO

from fastapi import HTTPException, status

from app.core.config import Settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class StorageService:
    """Handle storing uploaded PDFs and derived artifacts."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._base = settings.storage_dir
        self._uploads = settings.upload_dir
        self._max_size = settings.max_upload_size
        self._allowed_extensions = settings.allowed_extensions

    def validate_pdf(self, filename: str, file_size: int) -> None:
        """Validate PDF file before saving."""
        # Check file extension
        file_path = Path(filename)
        if file_path.suffix.lower() not in self._allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed: {', '.join(self._allowed_extensions)}"
            )

        # Check file size
        if file_size > self._max_size:
            max_mb = self._max_size / (1024 * 1024)
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size: {max_mb:.1f}MB"
            )

        logger.info(
            "PDF validation passed",
            filename=filename,
            size_mb=f"{file_size / (1024 * 1024):.2f}"
        )

    def save_upload(self, filename: str, file_obj: BinaryIO, user_id: str) -> tuple[Path, int]:
        """
        Save uploaded file and return path and file size.
        Files are organized by user ID for better organization.
        """
        # Create user-specific directory
        user_dir = self._uploads / user_id
        user_dir.mkdir(parents=True, exist_ok=True)

        # Generate unique filename to prevent overwrites
        from datetime import datetime
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        safe_filename = self._sanitize_filename(filename)
        unique_filename = f"{timestamp}_{safe_filename}"
        destination = user_dir / unique_filename

        # Save file and track size
        bytes_written = 0
        try:
            with destination.open("wb") as fh:
                while chunk := file_obj.read(8192):
                    fh.write(chunk)
                    bytes_written += len(chunk)

            logger.info(
                "File saved successfully",
                path=str(destination),
                size_bytes=bytes_written
            )

            return destination, bytes_written

        except Exception as e:
            # Clean up partial file on error
            if destination.exists():
                destination.unlink()
            logger.error(f"Error saving file: {e}", filename=filename)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save uploaded file"
            )

    def ensure_storage(self, document_id: str) -> Path:
        """Create storage directory for document artifacts."""
        path = self._base / f"doc_{document_id}"
        path.mkdir(parents=True, exist_ok=True)
        return path

    def delete_document_files(self, storage_path: str) -> bool:
        """Delete PDF and associated files."""
        try:
            pdf_path = Path(storage_path)
            if pdf_path.exists():
                pdf_path.unlink()
                logger.info(f"Deleted PDF file", path=str(pdf_path))
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting file: {e}", path=storage_path)
            return False

    @staticmethod
    def _sanitize_filename(filename: str) -> str:
        """Sanitize filename to prevent directory traversal and invalid chars."""
        # Remove path components
        safe_name = Path(filename).name

        # Replace potentially problematic characters
        invalid_chars = '<>:"|?*\\'
        for char in invalid_chars:
            safe_name = safe_name.replace(char, '_')

        # Limit length
        if len(safe_name) > 200:
            stem = Path(safe_name).stem[:190]
            suffix = Path(safe_name).suffix
            safe_name = f"{stem}{suffix}"

        return safe_name
