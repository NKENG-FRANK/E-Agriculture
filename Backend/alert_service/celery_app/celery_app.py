from celery import Celery
from celery.schedules import crontab
from config import settings

app= Celery(
    "alert_service",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "tasks.threshold_mail",
        "tasks.invite_mail",
        "tasks.daily_report",
    ],
)

app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)

# ── Celery Beat Schedule ──────────────────────────────────────────────────────
app.conf.beat_schedule = {
    "daily-farm-report": {
        "task": "tasks.daily_report.send_all_daily_reports",
        "schedule": crontab(hour=7, minute=0),  # Every day at 7:00 AM UTC
    },
}