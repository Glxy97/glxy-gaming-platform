"""DataPad REST API Client with retry logic and comprehensive error handling."""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Optional

import httpx
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.core.config import Settings
from app.schemas.datapad import (
    DataPadField,
    DataPadFieldCreate,
    DataPadFieldUpdate,
    DataPadMapping,
)

logger = logging.getLogger(__name__)


class DataPadAPIError(Exception):
    """Base exception for DataPad API errors."""

    def __init__(self, message: str, status_code: Optional[int] = None, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class DataPadAuthenticationError(DataPadAPIError):
    """Raised when authentication fails."""


class DataPadRateLimitError(DataPadAPIError):
    """Raised when rate limit is exceeded."""


class DataPadNotFoundError(DataPadAPIError):
    """Raised when resource is not found."""


class DataPadValidationError(DataPadAPIError):
    """Raised when request validation fails."""


class DataPadClient:
    """
    Asynchronous REST client for DataPad API.

    Features:
    - Bearer token authentication
    - Automatic retry with exponential backoff
    - Rate limiting awareness
    - Comprehensive error handling
    - Request/response logging
    """

    def __init__(self, settings: Settings) -> None:
        """
        Initialize DataPad client.

        Args:
            settings: Application settings containing DataPad configuration
        """
        self._base_url = settings.datapad_base_url
        self._api_key = settings.datapad_api_key
        self._timeout = 30.0
        self._max_retries = 3

        # Track rate limit headers from last response
        self._rate_limit_remaining: Optional[int] = None
        self._rate_limit_reset: Optional[int] = None

    @property
    def is_configured(self) -> bool:
        """Check if DataPad client is properly configured."""
        return bool(self._api_key and self._base_url)

    def _get_headers(self) -> Dict[str, str]:
        """Build request headers with authentication."""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"
        return headers

    def _update_rate_limits(self, response: httpx.Response) -> None:
        """Extract and store rate limit information from response headers."""
        if "X-RateLimit-Remaining" in response.headers:
            try:
                self._rate_limit_remaining = int(response.headers["X-RateLimit-Remaining"])
            except (ValueError, TypeError):
                pass

        if "X-RateLimit-Reset" in response.headers:
            try:
                self._rate_limit_reset = int(response.headers["X-RateLimit-Reset"])
            except (ValueError, TypeError):
                pass

    async def _handle_error_response(self, response: httpx.Response) -> None:
        """
        Parse error response and raise appropriate exception.

        Args:
            response: HTTP response object

        Raises:
            DataPadAuthenticationError: On 401/403
            DataPadNotFoundError: On 404
            DataPadValidationError: On 422
            DataPadRateLimitError: On 429
            DataPadAPIError: On other errors
        """
        status_code = response.status_code

        try:
            error_data = response.json()
            message = error_data.get("message", error_data.get("error", response.text))
            details = error_data.get("details", {})
        except Exception:
            message = response.text
            details = {}

        if status_code in (401, 403):
            raise DataPadAuthenticationError(message, status_code, details)
        elif status_code == 404:
            raise DataPadNotFoundError(message, status_code, details)
        elif status_code == 422:
            raise DataPadValidationError(message, status_code, details)
        elif status_code == 429:
            raise DataPadRateLimitError(message, status_code, details)
        else:
            raise DataPadAPIError(message, status_code, details)

    @retry(
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError)),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        stop=stop_after_attempt(3),
    )
    async def _request(
        self,
        method: str,
        endpoint: str,
        json: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Make HTTP request with retry logic.

        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint path
            json: Request body as dict
            params: Query parameters

        Returns:
            Response data as dict

        Raises:
            DataPadAPIError: On API errors
        """
        url = f"{self._base_url}{endpoint}"

        logger.debug(f"DataPad API: {method} {url}", extra={"params": params, "body": json})

        async with httpx.AsyncClient() as client:
            try:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=self._get_headers(),
                    json=json,
                    params=params,
                    timeout=self._timeout,
                )

                # Update rate limit tracking
                self._update_rate_limits(response)

                # Check for errors
                if response.status_code >= 400:
                    await self._handle_error_response(response)

                # Parse successful response
                data = response.json() if response.content else {}

                logger.debug(f"DataPad API response: {response.status_code}", extra={"data": data})

                return data

            except httpx.TimeoutException as e:
                logger.warning(f"DataPad API timeout: {url}")
                raise
            except httpx.NetworkError as e:
                logger.warning(f"DataPad API network error: {url}", exc_info=e)
                raise
            except DataPadAPIError:
                raise
            except Exception as e:
                logger.error(f"Unexpected error calling DataPad API: {url}", exc_info=e)
                raise DataPadAPIError(f"Unexpected error: {str(e)}")

    async def authenticate(self, api_key: str) -> Dict[str, Any]:
        """
        Verify API key and get account information.

        Args:
            api_key: DataPad API key to validate

        Returns:
            Account information dict

        Raises:
            DataPadAuthenticationError: If authentication fails
        """
        # Temporarily use provided key
        original_key = self._api_key
        self._api_key = api_key

        try:
            data = await self._request("GET", "/api/v1/auth/verify")
            logger.info("DataPad authentication successful")
            return data
        except DataPadAuthenticationError:
            logger.error("DataPad authentication failed")
            raise
        finally:
            self._api_key = original_key

    async def get_fields(self, group: Optional[str] = None) -> List[DataPadField]:
        """
        Retrieve all available DataPad fields.

        Args:
            group: Optional filter by field group

        Returns:
            List of DataPad fields
        """
        params = {"group": group} if group else None
        data = await self._request("GET", "/api/v1/fields", params=params)

        fields = [DataPadField(**item) for item in data.get("items", [])]
        logger.info(f"Retrieved {len(fields)} DataPad fields", extra={"group": group})

        return fields

    async def create_field(self, field_data: DataPadFieldCreate) -> DataPadField:
        """
        Create a new field in DataPad.

        Args:
            field_data: Field creation data

        Returns:
            Created field

        Raises:
            DataPadValidationError: If field data is invalid
        """
        data = await self._request("POST", "/api/v1/fields", json=field_data.model_dump())
        field = DataPadField(**data)

        logger.info(f"Created DataPad field: {field.id}", extra={"label": field.label})

        return field

    async def update_field(self, field_id: str, update_data: DataPadFieldUpdate) -> DataPadField:
        """
        Update an existing DataPad field.

        Args:
            field_id: ID of field to update
            update_data: Field update data (only changed fields)

        Returns:
            Updated field

        Raises:
            DataPadNotFoundError: If field doesn't exist
        """
        data = await self._request(
            "PATCH",
            f"/api/v1/fields/{field_id}",
            json=update_data.model_dump(exclude_unset=True),
        )
        field = DataPadField(**data)

        logger.info(f"Updated DataPad field: {field_id}")

        return field

    async def delete_field(self, field_id: str) -> None:
        """
        Delete a DataPad field.

        Args:
            field_id: ID of field to delete

        Raises:
            DataPadNotFoundError: If field doesn't exist
        """
        await self._request("DELETE", f"/api/v1/fields/{field_id}")
        logger.info(f"Deleted DataPad field: {field_id}")

    async def create_mapping(
        self,
        pdf_field_id: int,
        datapad_field_id: str,
        document_id: Optional[int] = None,
    ) -> DataPadMapping:
        """
        Create a mapping between PDF field and DataPad field.

        Args:
            pdf_field_id: ID of PDF form field
            datapad_field_id: ID of DataPad field
            document_id: Optional document/form ID for context

        Returns:
            Created mapping
        """
        payload = {
            "pdf_field_id": pdf_field_id,
            "datapad_field_id": datapad_field_id,
        }
        if document_id:
            payload["document_id"] = document_id

        data = await self._request("POST", "/api/v1/mappings", json=payload)
        mapping = DataPadMapping(**data)

        logger.info(
            f"Created field mapping: PDF {pdf_field_id} -> DataPad {datapad_field_id}",
            extra={"document_id": document_id},
        )

        return mapping

    async def get_mappings(self, document_id: Optional[int] = None) -> List[DataPadMapping]:
        """
        Retrieve field mappings.

        Args:
            document_id: Optional filter by document

        Returns:
            List of mappings
        """
        params = {"document_id": document_id} if document_id else None
        data = await self._request("GET", "/api/v1/mappings", params=params)

        mappings = [DataPadMapping(**item) for item in data.get("items", [])]
        logger.info(f"Retrieved {len(mappings)} field mappings")

        return mappings

    async def delete_mapping(self, mapping_id: str) -> None:
        """
        Delete a field mapping.

        Args:
            mapping_id: ID of mapping to delete
        """
        await self._request("DELETE", f"/api/v1/mappings/{mapping_id}")
        logger.info(f"Deleted field mapping: {mapping_id}")

    async def health_check(self) -> Dict[str, Any]:
        """
        Check DataPad API health and connectivity.

        Returns:
            Health status information
        """
        try:
            data = await self._request("GET", "/api/v1/health")
            logger.info("DataPad health check: OK")
            return {"status": "healthy", "details": data}
        except Exception as e:
            logger.error(f"DataPad health check failed: {e}")
            return {"status": "unhealthy", "error": str(e)}
