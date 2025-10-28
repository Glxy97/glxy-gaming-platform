"""Application configuration settings handled via pydantic."""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration loaded from environment variables or .env."""

    app_name: str = "Web Adobe Backend"
    environment: str = Field("development", pattern=r"^(development|staging|production)$")
    debug: bool = True

    api_prefix: str = "/api"
    allowed_origins: List[str] = Field(default_factory=lambda: ["http://localhost:5173", "http://localhost:3000"])
    allowed_api_keys: List[str] = Field(default_factory=list)

    # Storage Configuration
    storage_dir: Path = Path("var/storage")
    upload_dir: Path = Path("var/uploads")
    max_upload_size: int = 50 * 1024 * 1024  # 50MB
    allowed_extensions: List[str] = Field(default_factory=lambda: [".pdf"])

    # Database - PostgreSQL (shared with Next.js via Prisma)
    database_url: str = "postgresql://glxy_admin:glxy_password@localhost:5432/glxy_gaming"

    # Redis Configuration
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str | None = None
    celery_result_backend: str | None = None

    # AI Provider Configuration (Optional)
    ai_provider: str | None = Field(None, description="AI provider: openai, anthropic, or gemini")
    ai_api_key: str | None = None
    ai_model: str | None = Field(None, description="Model name like gpt-4, claude-3-opus, gemini-pro")

    # DataPad Integration (Optional)
    datapad_base_url: str = "https://api.datapad.local"
    datapad_api_key: str | None = None

    # PDF Processing Configuration
    ocr_enabled: bool = True
    ocr_language: str = "deu+eng"  # German + English
    pdf_dpi: int = 300

    model_config = SettingsConfigDict(
        env_file=".env.local" if os.path.exists(".env.local") else ".env",
        env_nested_delimiter="__",
        extra="ignore",
        case_sensitive=False
    )

    @field_validator("celery_broker_url", mode="before")
    @classmethod
    def _default_broker(cls, value: str | None, info) -> str:
        if value:
            return value
        return str(info.data.get("redis_url", "redis://localhost:6379/0"))

    @field_validator("celery_result_backend", mode="before")
    @classmethod
    def _default_backend(cls, value: str | None, info) -> str:
        if value:
            return value
        return str(info.data.get("redis_url", "redis://localhost:6379/0"))

    @field_validator("storage_dir", "upload_dir", mode="before")
    @classmethod
    def _ensure_path(cls, value: Path | str) -> Path:
        path = Path(value) if isinstance(value, str) else value
        path.mkdir(parents=True, exist_ok=True)
        return path


@lru_cache
def get_settings() -> Settings:
    return Settings()
