"""Celery application factory."""

from __future__ import annotations

from celery import Celery

from app.core.config import get_settings

settings = get_settings()
celery_app = Celery(
    "web_adobe",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)
celery_app.conf.task_default_queue = "web_adobe_default"
celery_app.conf.task_routes = {
    "app.worker.tasks.analyze_pdf": {"queue": "analysis"},
    "app.worker.tasks.sync_datapad": {"queue": "sync"},
}