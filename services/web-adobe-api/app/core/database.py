"""Database utilities using SQLModel with PostgreSQL support."""

from __future__ import annotations

from typing import Generator

from sqlmodel import SQLModel, create_engine, Session

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

settings = get_settings()

# PostgreSQL engine configuration with connection pooling
engine = create_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,  # Test connections before using
    pool_size=5,
    max_overflow=10,
    pool_recycle=3600,  # Recycle connections after 1 hour
)


def init_db() -> None:
    """
    Initialize database tables.

    Note: In production, tables are managed by Prisma migrations.
    This is only used for development/testing.
    """
    logger.info("Initializing database tables")

    # Import models to register them with SQLModel.metadata
    try:
        from app.models.form import PdfDocument, PdfField  # noqa: F401
        SQLModel.metadata.create_all(engine)
        logger.info("Database initialization complete")
    except Exception as e:
        logger.warning(f"Database initialization skipped: {e}")


def get_session() -> Generator[Session, None, None]:
    """Get database session with automatic cleanup."""
    with Session(engine) as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Database session error: {e}")
            session.rollback()
            raise
        finally:
            session.close()
