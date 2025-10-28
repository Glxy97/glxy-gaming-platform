"""Common response schemas."""

from __future__ import annotations

from typing import Any, List, Optional

from pydantic import BaseModel


class StatusResponse(BaseModel):
    status: str
    detail: Optional[str] = None


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int