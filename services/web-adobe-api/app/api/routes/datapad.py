"""Routes for DataPad integration."""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session

from app.api.dependencies import get_datapad_client, get_sync_service
from app.core.database import get_session
from app.schemas.datapad import (
    DataPadErrorResponse,
    DataPadField,
    DataPadFieldCreate,
    DataPadFieldList,
    DataPadFieldUpdate,
    DataPadHealthResponse,
    DataPadMapping,
    DataPadMappingCreate,
    DataPadSyncPayload,
    DataPadSyncResponse,
    DataPadSyncStatusResponse,
)
from app.services.datapad_client import (
    DataPadAPIError,
    DataPadAuthenticationError,
    DataPadClient,
    DataPadNotFoundError,
    DataPadRateLimitError,
    DataPadValidationError,
)
from app.services.sync_service import SyncService

router = APIRouter(prefix="/datapad", tags=["datapad"])


def handle_datapad_error(error: DataPadAPIError) -> HTTPException:
    """Convert DataPad API error to HTTP exception."""
    if isinstance(error, DataPadAuthenticationError):
        status_code = status.HTTP_401_UNAUTHORIZED
    elif isinstance(error, DataPadNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, DataPadValidationError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(error, DataPadRateLimitError):
        status_code = status.HTTP_429_TOO_MANY_REQUESTS
    else:
        status_code = error.status_code or status.HTTP_500_INTERNAL_SERVER_ERROR

    return HTTPException(
        status_code=status_code,
        detail={
            "error": error.__class__.__name__,
            "message": error.message,
            "details": error.details,
        },
    )


# ==========================================
# Field Management
# ==========================================


@router.get("/fields", response_model=DataPadFieldList)
async def list_datapad_fields(
    group: Optional[str] = Query(None, description="Filter by field group"),
    datapad: DataPadClient = Depends(get_datapad_client),
) -> DataPadFieldList:
    """
    Get all available DataPad fields.

    Args:
        group: Optional filter by field group
        datapad: DataPad client dependency

    Returns:
        List of DataPad fields

    Raises:
        401: If authentication fails
        429: If rate limit exceeded
        500: On server errors
    """
    try:
        fields = await datapad.get_fields(group=group)
        return DataPadFieldList(items=fields, total=len(fields))
    except DataPadAPIError as e:
        raise handle_datapad_error(e)


@router.post("/fields", response_model=DataPadField, status_code=status.HTTP_201_CREATED)
async def create_datapad_field(
    field_data: DataPadFieldCreate,
    datapad: DataPadClient = Depends(get_datapad_client),
) -> DataPadField:
    """
    Create a new field in DataPad.

    Args:
        field_data: Field creation data
        datapad: DataPad client dependency

    Returns:
        Created field

    Raises:
        422: If validation fails
        401: If authentication fails
        500: On server errors
    """
    try:
        return await datapad.create_field(field_data)
    except DataPadAPIError as e:
        raise handle_datapad_error(e)


@router.patch("/fields/{field_id}", response_model=DataPadField)
async def update_datapad_field(
    field_id: str,
    update_data: DataPadFieldUpdate,
    datapad: DataPadClient = Depends(get_datapad_client),
) -> DataPadField:
    """
    Update an existing DataPad field.

    Args:
        field_id: ID of field to update
        update_data: Field update data (partial)
        datapad: DataPad client dependency

    Returns:
        Updated field

    Raises:
        404: If field not found
        422: If validation fails
        500: On server errors
    """
    try:
        return await datapad.update_field(field_id, update_data)
    except DataPadAPIError as e:
        raise handle_datapad_error(e)


@router.delete("/fields/{field_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_datapad_field(
    field_id: str,
    datapad: DataPadClient = Depends(get_datapad_client),
):
    """
    Delete a DataPad field.

    Args:
        field_id: ID of field to delete
        datapad: DataPad client dependency

    Raises:
        404: If field not found
        500: On server errors
    """
    try:
        await datapad.delete_field(field_id)
    except DataPadAPIError as e:
        raise handle_datapad_error(e)


# ==========================================
# Field Mappings
# ==========================================


@router.get("/mappings", response_model=List[DataPadMapping])
async def list_mappings(
    document_id: Optional[int] = Query(None, description="Filter by document ID"),
    datapad: DataPadClient = Depends(get_datapad_client),
) -> List[DataPadMapping]:
    """
    Get field mappings.

    Args:
        document_id: Optional filter by document
        datapad: DataPad client dependency

    Returns:
        List of field mappings
    """
    try:
        return await datapad.get_mappings(document_id=document_id)
    except DataPadAPIError as e:
        raise handle_datapad_error(e)


@router.post("/mappings", response_model=DataPadMapping, status_code=status.HTTP_201_CREATED)
async def create_mapping(
    mapping_data: DataPadMappingCreate,
    datapad: DataPadClient = Depends(get_datapad_client),
) -> DataPadMapping:
    """
    Create a field mapping between PDF field and DataPad field.

    Args:
        mapping_data: Mapping creation data
        datapad: DataPad client dependency

    Returns:
        Created mapping
    """
    try:
        return await datapad.create_mapping(
            pdf_field_id=mapping_data.pdf_field_id,
            datapad_field_id=mapping_data.datapad_field_id,
            document_id=mapping_data.document_id,
        )
    except DataPadAPIError as e:
        raise handle_datapad_error(e)


@router.delete("/mappings/{mapping_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_mapping(
    mapping_id: str,
    datapad: DataPadClient = Depends(get_datapad_client),
) :
    """
    Delete a field mapping.

    Args:
        mapping_id: ID of mapping to delete
        datapad: DataPad client dependency
    """
    try:
        await datapad.delete_mapping(mapping_id)
    except DataPadAPIError as e:
        raise handle_datapad_error(e)


# ==========================================
# Synchronization
# ==========================================


@router.post("/forms/{form_id}/sync", response_model=DataPadSyncResponse)
async def sync_form(
    form_id: int,
    payload: Optional[DataPadSyncPayload] = None,
    sync_service: SyncService = Depends(get_sync_service),
) -> DataPadSyncResponse:
    """
    Synchronize form fields with DataPad.

    Process:
    1. Validates form exists
    2. For each field (or specified fields):
       - Creates/updates DataPad field
       - Establishes mapping
       - Tracks status
    3. Returns detailed results

    Args:
        form_id: ID of form to sync
        payload: Optional sync configuration
        sync_service: Sync service dependency

    Returns:
        Sync response with results for each field

    Raises:
        404: If form not found
        422: If validation fails
        500: On sync errors
    """
    try:
        # Use payload or create default
        if not payload:
            payload = DataPadSyncPayload(form_id=form_id)

        return await sync_service.sync_document(
            document_id=form_id,
            field_ids=payload.field_ids if payload.field_ids else None,
            force=payload.force,
            conflict_resolution=payload.conflict_resolution,
        )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except DataPadAPIError as e:
        raise handle_datapad_error(e)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sync failed: {str(e)}",
        )


@router.get("/forms/{form_id}/sync-status", response_model=DataPadSyncStatusResponse)
async def get_sync_status(
    form_id: int,
    sync_service: SyncService = Depends(get_sync_service),
) -> DataPadSyncStatusResponse:
    """
    Get current sync status for a form.

    Returns field counts and sync state.

    Args:
        form_id: ID of form
        sync_service: Sync service dependency

    Returns:
        Current sync status

    Raises:
        404: If form not found
    """
    try:
        return await sync_service.get_sync_status(form_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/forms/{form_id}/sync/reset", status_code=status.HTTP_200_OK)
async def reset_sync(
    form_id: int,
    field_ids: Optional[List[int]] = Query(None, description="Specific field IDs to reset"),
    sync_service: SyncService = Depends(get_sync_service),
) -> dict:
    """
    Reset sync status for form fields.

    Clears DataPad mappings and sets status back to pending.

    Args:
        form_id: ID of form
        field_ids: Optional specific field IDs
        sync_service: Sync service dependency

    Returns:
        Number of fields reset

    Raises:
        404: If form not found
    """
    try:
        count = await sync_service.reset_sync_status(form_id, field_ids)
        return {"form_id": form_id, "fields_reset": count}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# ==========================================
# Health & Status
# ==========================================


@router.get("/health", response_model=DataPadHealthResponse)
async def health_check(
    datapad: DataPadClient = Depends(get_datapad_client),
) -> DataPadHealthResponse:
    """
    Check DataPad API connectivity and authentication.

    Returns:
        Health status including rate limits

    Example response:
    ```json
    {
      "status": "healthy",
      "api_available": true,
      "authenticated": true,
      "rate_limit_remaining": 4950,
      "rate_limit_reset": 1704067200
    }
    ```
    """
    try:
        health_data = await datapad.health_check()

        # Try to authenticate if configured
        authenticated = False
        if datapad.is_configured:
            try:
                await datapad.authenticate(datapad._api_key)
                authenticated = True
            except DataPadAuthenticationError:
                pass

        return DataPadHealthResponse(
            status=health_data.get("status", "unknown"),
            api_available=health_data.get("status") == "healthy",
            authenticated=authenticated,
            rate_limit_remaining=datapad._rate_limit_remaining,
            rate_limit_reset=datapad._rate_limit_reset,
            details=health_data.get("details"),
        )

    except Exception as e:
        return DataPadHealthResponse(
            status="unhealthy",
            api_available=False,
            authenticated=False,
            details={"error": str(e)},
        )
