"""Structured logging configuration using structlog."""

from __future__ import annotations

import logging
import sys

import structlog


def setup_logging(debug: bool = False) -> None:
    """
    Configure structured logging with structlog.

    Features:
    - JSON formatting for production
    - Console formatting for development
    - Request ID correlation
    - Performance metrics
    """
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.DEBUG if debug else logging.INFO,
    )

    # Configure structlog processors
    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if debug:
        # Development: pretty console output
        processors.append(structlog.dev.ConsoleRenderer())
    else:
        # Production: JSON output
        processors.append(structlog.processors.JSONRenderer())

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """Get a structured logger instance."""
    return structlog.get_logger(name)


# Initialize logging on module import
from app.core.config import get_settings
settings = get_settings()
setup_logging(debug=settings.debug)
