"""Service for synchronizing form fields with DataPad."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import List, Optional, Tuple

from sqlmodel import Session, select

from app.models.form import PdfDocument, PdfField
from app.schemas.datapad import (
    DataPadFieldCreate,
    DataPadSyncPayload,
    DataPadSyncResponse,
    DataPadSyncResult,
    DataPadSyncStatusResponse,
    SyncStatus,
)
from app.services.datapad_client import (
    DataPadAPIError,
    DataPadClient,
    DataPadNotFoundError,
)

logger = logging.getLogger(__name__)


class SyncConflictError(Exception):
    """Raised when a sync conflict is detected and cannot be auto-resolved."""

    def __init__(self, field_id: int, message: str):
        self.field_id = field_id
        self.message = message
        super().__init__(message)


class SyncService:
    """
    Service for synchronizing PDF form fields with DataPad backend.

    Responsibilities:
    - Orchestrate sync operations
    - Track sync status (PENDING → SYNCING → SYNCED/ERROR)
    - Handle conflict resolution
    - Maintain audit trail
    - Batch operations for efficiency
    """

    def __init__(self, session: Session, datapad_client: DataPadClient) -> None:
        """
        Initialize sync service.

        Args:
            session: Database session
            datapad_client: DataPad API client
        """
        self.session = session
        self.datapad = datapad_client

    async def sync_document(
        self,
        document_id: int,
        field_ids: Optional[List[int]] = None,
        force: bool = False,
        conflict_resolution: str = "skip",
    ) -> DataPadSyncResponse:
        """
        Synchronize all fields of a document with DataPad.

        Process:
        1. Validate document exists
        2. Get fields to sync (all or specific IDs)
        3. Update status to SYNCING
        4. For each field:
           - Check if DataPad mapping exists
           - Create or update DataPad field
           - Handle conflicts
           - Update local status
        5. Return summary

        Args:
            document_id: Form/document ID
            field_ids: Optional list of specific field IDs to sync
            force: Force re-sync even if already synced
            conflict_resolution: How to handle conflicts (skip/overwrite/merge)

        Returns:
            Sync response with results for each field

        Raises:
            ValueError: If document not found
        """
        started_at = datetime.utcnow()

        # Get document
        form = self.session.get(Form, document_id)
        if not form:
            raise ValueError(f"Document {document_id} not found")

        # Get fields to sync
        query = select(FormField).where(FormField.form_id == document_id)
        if field_ids:
            query = query.where(FormField.id.in_(field_ids))

        fields = self.session.exec(query).all()

        if not fields:
            return DataPadSyncResponse(
                form_id=document_id,
                status=SyncStatus.synced,
                results=[],
                summary={"synced": 0, "pending": 0, "failed": 0, "skipped": 0},
                message="No fields to sync",
                started_at=started_at,
                completed_at=datetime.utcnow(),
            )

        logger.info(
            f"Starting sync for document {document_id}",
            extra={
                "total_fields": len(fields),
                "force": force,
                "conflict_resolution": conflict_resolution,
            },
        )

        # Process each field
        results: List[DataPadSyncResult] = []
        summary = {"synced": 0, "pending": 0, "failed": 0, "skipped": 0}

        for field in fields:
            result = await self._sync_field(
                field=field,
                force=force,
                conflict_resolution=conflict_resolution,
            )
            results.append(result)

            # Update summary
            if result.status == SyncStatus.synced:
                summary["synced"] += 1
            elif result.status == SyncStatus.pending:
                summary["pending"] += 1
            elif result.status == SyncStatus.error:
                summary["failed"] += 1
            else:
                summary["skipped"] += 1

        # Determine overall status
        if summary["failed"] > 0:
            overall_status = SyncStatus.error
        elif summary["pending"] > 0:
            overall_status = SyncStatus.syncing
        else:
            overall_status = SyncStatus.synced

        completed_at = datetime.utcnow()

        logger.info(
            f"Sync completed for document {document_id}",
            extra={
                "status": overall_status,
                "summary": summary,
                "duration": (completed_at - started_at).total_seconds(),
            },
        )

        return DataPadSyncResponse(
            form_id=document_id,
            status=overall_status,
            results=results,
            summary=summary,
            started_at=started_at,
            completed_at=completed_at,
        )

    async def _sync_field(
        self,
        field: FormField,
        force: bool,
        conflict_resolution: str,
    ) -> DataPadSyncResult:
        """
        Sync a single field with DataPad.

        Args:
            field: FormField to sync
            force: Force sync even if already synced
            conflict_resolution: Conflict strategy

        Returns:
            Sync result for this field
        """
        # Skip if already synced and not forcing
        if field.datapad_field_id and field.status == "synced" and not force:
            logger.debug(f"Skipping field {field.id} - already synced")
            return DataPadSyncResult(
                field_id=field.id,
                status=SyncStatus.synced,
                datapad_field_id=field.datapad_field_id,
            )

        # Update field status to syncing
        field.status = "syncing"
        field.updated_at = datetime.utcnow()
        self.session.add(field)
        self.session.commit()

        try:
            # Check if mapping exists
            if field.datapad_field_id:
                # Update existing DataPad field
                datapad_field = await self._update_datapad_field(field)
            else:
                # Create new DataPad field
                datapad_field = await self._create_datapad_field(field)

            # Update local field with DataPad ID
            field.datapad_field_id = datapad_field.id
            field.status = "synced"
            field.updated_at = datetime.utcnow()
            self.session.add(field)
            self.session.commit()

            logger.info(f"Successfully synced field {field.id} -> DataPad {datapad_field.id}")

            return DataPadSyncResult(
                field_id=field.id,
                status=SyncStatus.synced,
                datapad_field_id=datapad_field.id,
                synced_at=datetime.utcnow(),
            )

        except DataPadNotFoundError as e:
            # DataPad field was deleted - handle as conflict
            logger.warning(f"DataPad field {field.datapad_field_id} not found for field {field.id}")

            if conflict_resolution == "overwrite":
                # Create new DataPad field
                field.datapad_field_id = None
                return await self._sync_field(field, force=True, conflict_resolution=conflict_resolution)
            else:
                # Mark as conflict
                field.status = "conflict"
                self.session.add(field)
                self.session.commit()

                return DataPadSyncResult(
                    field_id=field.id,
                    status=SyncStatus.conflict,
                    error_message=f"DataPad field not found: {e.message}",
                )

        except DataPadAPIError as e:
            logger.error(f"Failed to sync field {field.id}: {e.message}", exc_info=e)

            field.status = "error"
            self.session.add(field)
            self.session.commit()

            return DataPadSyncResult(
                field_id=field.id,
                status=SyncStatus.error,
                error_message=f"{e.__class__.__name__}: {e.message}",
            )

        except Exception as e:
            logger.error(f"Unexpected error syncing field {field.id}", exc_info=e)

            field.status = "error"
            self.session.add(field)
            self.session.commit()

            return DataPadSyncResult(
                field_id=field.id,
                status=SyncStatus.error,
                error_message=f"Unexpected error: {str(e)}",
            )

    async def _create_datapad_field(self, field: FormField):
        """Create a new field in DataPad."""
        # Map field type
        field_type = self._map_field_type(field.field_type)

        create_data = DataPadFieldCreate(
            label=field.display_label or field.pdf_name,
            field_type=field_type,
            group=field.group_name,
            required=field.required,
            validation_rules={"pattern": field.validation_pattern} if field.validation_pattern else None,
            metadata={
                "pdf_name": field.pdf_name,
                "form_id": field.form_id,
                "field_id": field.id,
            },
        )

        return await self.datapad.create_field(create_data)

    async def _update_datapad_field(self, field: FormField):
        """Update an existing DataPad field."""
        from app.schemas.datapad import DataPadFieldUpdate

        field_type = self._map_field_type(field.field_type)

        update_data = DataPadFieldUpdate(
            label=field.display_label or field.pdf_name,
            field_type=field_type,
            group=field.group_name,
            required=field.required,
            validation_rules={"pattern": field.validation_pattern} if field.validation_pattern else None,
        )

        return await self.datapad.update_field(field.datapad_field_id, update_data)

    def _map_field_type(self, pdf_field_type: str) -> str:
        """Map PDF field type to DataPad field type."""
        mapping = {
            "text": "text",
            "textarea": "textarea",
            "number": "number",
            "email": "email",
            "phone": "phone",
            "date": "date",
            "checkbox": "checkbox",
            "radio": "radio",
            "dropdown": "select",
            "signature": "signature",
            "file": "file",
        }
        return mapping.get(pdf_field_type.lower(), "text")

    async def get_sync_status(self, document_id: int) -> DataPadSyncStatusResponse:
        """
        Get current sync status for a document.

        Args:
            document_id: Form/document ID

        Returns:
            Status response with field counts and errors
        """
        form = self.session.get(Form, document_id)
        if not form:
            raise ValueError(f"Document {document_id} not found")

        # Get all fields
        query = select(FormField).where(FormField.form_id == document_id)
        fields = self.session.exec(query).all()

        total_fields = len(fields)
        synced_fields = sum(1 for f in fields if f.status == "synced")
        pending_fields = sum(1 for f in fields if f.status in ("pending", "draft"))
        failed_fields = sum(1 for f in fields if f.status == "error")

        # Get last sync time
        synced = [f for f in fields if f.status == "synced"]
        last_sync_at = max((f.updated_at for f in synced), default=None) if synced else None

        # Collect errors
        errors = [
            f"Field {f.id} ({f.pdf_name}): Sync failed"
            for f in fields
            if f.status == "error"
        ]

        # Determine overall status
        if failed_fields > 0:
            status = SyncStatus.error
        elif pending_fields > 0:
            status = SyncStatus.pending
        elif total_fields == synced_fields:
            status = SyncStatus.synced
        else:
            status = SyncStatus.pending

        return DataPadSyncStatusResponse(
            form_id=document_id,
            status=status,
            total_fields=total_fields,
            synced_fields=synced_fields,
            pending_fields=pending_fields,
            failed_fields=failed_fields,
            last_sync_at=last_sync_at,
            error_count=len(errors),
            errors=errors,
        )

    async def reset_sync_status(self, document_id: int, field_ids: Optional[List[int]] = None) -> int:
        """
        Reset sync status for document fields.

        Args:
            document_id: Form/document ID
            field_ids: Optional specific field IDs to reset

        Returns:
            Number of fields reset
        """
        query = select(FormField).where(FormField.form_id == document_id)
        if field_ids:
            query = query.where(FormField.id.in_(field_ids))

        fields = self.session.exec(query).all()

        count = 0
        for field in fields:
            field.status = "pending"
            field.datapad_field_id = None
            field.updated_at = datetime.utcnow()
            self.session.add(field)
            count += 1

        self.session.commit()

        logger.info(f"Reset sync status for {count} fields in document {document_id}")

        return count
