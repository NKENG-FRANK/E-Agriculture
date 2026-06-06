from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from tasks.threshold_mail import send_threshold_alert_task
from tasks.invite_mail import send_invite_task

app = FastAPI(
    title="SFMS Alert Service",
    description="Handles threshold alerts, consultation invites, and daily farm reports.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://144.91.89.100:8081",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ───────────────────────────────────────────────────────────────────

class ThresholdAlertPayload(BaseModel):
    farm_id: str
    device: str
    anomalies: dict  # e.g. {"temperature": True, "humidity": False, ...}


class InvitePayload(BaseModel):
    to_email: str
    fullname: str
    farm_type: str


# ── Routes ────────────────────────────────────────────────────────────────────

@app.post("/alerts/threshold", status_code=202)
def trigger_threshold_alert(payload: ThresholdAlertPayload):
    """
    Called by the analytics service when a sensor anomaly is detected.
    Queues a Celery task to send the alert email — returns immediately.
    """
    any_anomaly = any(payload.anomalies.values())
    if not any_anomaly:
        return {"status": "skipped", "reason": "no anomalies in payload"}

    send_threshold_alert_task.delay(
        farm_id=payload.farm_id,
        device=payload.device,
        anomalies=payload.anomalies,
    )

    return {"status": "queued", "farm_id": payload.farm_id, "device": payload.device}


@app.post("/alerts/invite", status_code=202)
def trigger_invite(payload: InvitePayload):
    """
    Called by the auth service when an admin approves a consultation request.
    Queues a Celery task to send the signup invite email.
    """
    send_invite_task.delay(
        to_email=payload.to_email,
        fullname=payload.fullname,
        farm_type=payload.farm_type,
    )

    return {"status": "queued", "to": payload.to_email}


@app.get("/alerts/health")
def health():
    return {"status": "ok"}