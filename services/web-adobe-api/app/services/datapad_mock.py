"""Mock DataPad client for testing without actual DataPad connection."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.schemas.datapad import (
    DataPadField,
    DataPadFieldCreate,
    DataPadFieldUpdate,
    DataPadMapping,
)

logger = logging.getLogger(__name__)


class DataPadMockClient:
    """
    Mock implementation of DataPad API client.

    Used when no API key is configured or for testing.
    Provides same interface as real DataPadClient but uses in-memory storage.
    """

    def __init__(self) -> None:
        """Initialize mock client with sample data."""
        self._fields: Dict[str, DataPadField] = {}
        self._mappings: Dict[str, DataPadMapping] = {}
        self._is_configured = True

        # Create some demo fields
        self._create_demo_fields()

    def _create_demo_fields(self) -> None:
        """Populate mock storage with demo fields."""
        demo_fields = [
            DataPadField(
                id="demo-001",
                label="Kundennummer",
                field_type="text",
                group="Allgemein",
                required=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            ),
            DataPadField(
                id="demo-002",
                label="Firmenname",
                field_type="text",
                group="Allgemein",
                required=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            ),
            DataPadField(
                id="demo-003",
                label="E-Mail-Adresse",
                field_type="email",
                group="Kontakt",
                required=True,
                validation_rules={"pattern": r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"},
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            ),
            DataPadField(
                id="demo-004",
                label="Telefonnummer",
                field_type="phone",
                group="Kontakt",
                required=False,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            ),
            DataPadField(
                id="demo-005",
                label="Unterschrift",
                field_type="signature",
                group="Vertrag",
                required=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            ),
            DataPadField(
                id="demo-006",
                label="Datum",
                field_type="date",
                group="Vertrag",
                required=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            ),
            DataPadField(
                id="demo-007",
                label="Bemerkungen",
                field_type="textarea",
                group="Sonstiges",
                required=False,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            ),
        ]

        for field in demo_fields:
            self._fields[field.id] = field

        logger.info(f"Mock DataPad initialized with {len(demo_fields)} demo fields")

    @property
    def is_configured(self) -> bool:
        """Mock is always configured."""
        return True

    async def authenticate(self, api_key: str) -> Dict[str, Any]:
        """Mock authentication always succeeds."""
        logger.info("Mock DataPad authentication (always succeeds)")
        return {
            "user_id": "mock-user",
            "account_name": "Mock Account",
            "tier": "demo",
            "authenticated": True,
        }

    async def get_fields(self, group: Optional[str] = None) -> List[DataPadField]:
        """
        Get all mock fields, optionally filtered by group.

        Args:
            group: Optional group filter

        Returns:
            List of mock fields
        """
        fields = list(self._fields.values())

        if group:
            fields = [f for f in fields if f.group == group]

        logger.debug(f"Mock DataPad: Retrieved {len(fields)} fields (group={group})")
        return fields

    async def create_field(self, field_data: DataPadFieldCreate) -> DataPadField:
        """
        Create a new mock field.

        Args:
            field_data: Field creation data

        Returns:
            Created mock field
        """
        field_id = f"mock-{uuid.uuid4().hex[:8]}"

        field = DataPadField(
            id=field_id,
            label=field_data.label,
            field_type=field_data.field_type,
            group=field_data.group,
            required=field_data.required,
            default_value=field_data.default_value,
            validation_rules=field_data.validation_rules,
            metadata=field_data.metadata,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        self._fields[field_id] = field

        logger.info(f"Mock DataPad: Created field {field_id}", extra={"label": field.label})

        return field

    async def update_field(self, field_id: str, update_data: DataPadFieldUpdate) -> DataPadField:
        """
        Update a mock field.

        Args:
            field_id: ID of field to update
            update_data: Update data

        Returns:
            Updated field

        Raises:
            KeyError: If field doesn't exist
        """
        if field_id not in self._fields:
            from app.services.datapad_client import DataPadNotFoundError

            raise DataPadNotFoundError(f"Mock field {field_id} not found", 404)

        field = self._fields[field_id]

        # Apply updates
        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            if hasattr(field, key):
                setattr(field, key, value)

        field.updated_at = datetime.utcnow()

        logger.info(f"Mock DataPad: Updated field {field_id}")

        return field

    async def delete_field(self, field_id: str) -> None:
        """
        Delete a mock field.

        Args:
            field_id: ID of field to delete

        Raises:
            KeyError: If field doesn't exist
        """
        if field_id not in self._fields:
            from app.services.datapad_client import DataPadNotFoundError

            raise DataPadNotFoundError(f"Mock field {field_id} not found", 404)

        del self._fields[field_id]

        logger.info(f"Mock DataPad: Deleted field {field_id}")

    async def create_mapping(
        self,
        pdf_field_id: int,
        datapad_field_id: str,
        document_id: Optional[int] = None,
    ) -> DataPadMapping:
        """
        Create a mock mapping.

        Args:
            pdf_field_id: PDF field ID
            datapad_field_id: DataPad field ID
            document_id: Optional document ID

        Returns:
            Created mapping
        """
        mapping_id = f"map-{uuid.uuid4().hex[:8]}"

        mapping = DataPadMapping(
            id=mapping_id,
            pdf_field_id=pdf_field_id,
            datapad_field_id=datapad_field_id,
            document_id=document_id,
            status="pending",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        self._mappings[mapping_id] = mapping

        logger.info(
            f"Mock DataPad: Created mapping {mapping_id}",
            extra={
                "pdf_field": pdf_field_id,
                "datapad_field": datapad_field_id,
            },
        )

        return mapping

    async def get_mappings(self, document_id: Optional[int] = None) -> List[DataPadMapping]:
        """
        Get mock mappings, optionally filtered by document.

        Args:
            document_id: Optional document filter

        Returns:
            List of mappings
        """
        mappings = list(self._mappings.values())

        if document_id is not None:
            mappings = [m for m in mappings if m.document_id == document_id]

        logger.debug(f"Mock DataPad: Retrieved {len(mappings)} mappings (document={document_id})")

        return mappings

    async def delete_mapping(self, mapping_id: str) -> None:
        """
        Delete a mock mapping.

        Args:
            mapping_id: ID of mapping to delete
        """
        if mapping_id not in self._mappings:
            from app.services.datapad_client import DataPadNotFoundError

            raise DataPadNotFoundError(f"Mock mapping {mapping_id} not found", 404)

        del self._mappings[mapping_id]

        logger.info(f"Mock DataPad: Deleted mapping {mapping_id}")

    async def health_check(self) -> Dict[str, Any]:
        """Mock health check always returns healthy."""
        return {
            "status": "healthy",
            "details": {
                "mode": "mock",
                "fields_count": len(self._fields),
                "mappings_count": len(self._mappings),
            },
        }

    def reset(self) -> None:
        """Reset mock data to initial state (useful for testing)."""
        self._fields.clear()
        self._mappings.clear()
        self._create_demo_fields()
        logger.info("Mock DataPad reset to initial state")
