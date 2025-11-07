"""Lightweight background task helpers with optional Celery integration."""
import os
from datetime import datetime

try:
    from celery import Celery
except ImportError:  # pragma: no cover - Celery is optional
    Celery = None


CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', os.getenv('REDIS_URL', 'redis://localhost:6379/2'))
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', CELERY_BROKER_URL)

celery_app = Celery('chronicle_tasks', broker=CELERY_BROKER_URL, backend=CELERY_RESULT_BACKEND) if Celery else None


def _log_task(message, payload=None):
    """Fallback logging when Celery is not configured."""
    print(f"[BackgroundTask] {datetime.utcnow().isoformat()} :: {message} :: {payload or {}}")


def enqueue_email_notification(recipient, subject, body):
    task_payload = {'recipient': recipient, 'subject': subject, 'body': body}
    if celery_app:
        celery_app.send_task('chronicle.email_notification', kwargs=task_payload)
    else:
        _log_task('Email notification queued (sync fallback)', task_payload)


def enqueue_pdf_generation(entity, entity_id):
    task_payload = {'entity': entity, 'entity_id': entity_id}
    if celery_app:
        celery_app.send_task('chronicle.generate_pdf', kwargs=task_payload)
    else:
        _log_task('PDF generation fallback', task_payload)


def enqueue_image_optimization(path):
    task_payload = {'path': path}
    if celery_app:
        celery_app.send_task('chronicle.optimize_image', kwargs=task_payload)
    else:
        _log_task('Image optimization fallback', task_payload)


def enqueue_report_generation(report_type, filters=None):
    task_payload = {'report_type': report_type, 'filters': filters or {}}
    if celery_app:
        celery_app.send_task('chronicle.generate_report', kwargs=task_payload)
    else:
        _log_task('Report generation fallback', task_payload)
