from dotenv import load_dotenv
load_dotenv()  # Loads DATABASE_URL from .env before database.py reads it

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from database import engine, get_db, Base
from models import (
    SensorReading,
    SensorReadingIn,
    SensorReadingOut,
    IngestResponse,
    AnalyticsResponse,
)
from analytics import compute_averages, detect_anomalies, get_latest_anomalies

# ── App Init ──────────────────────────────────────────────────────────────────

app = FastAPI(
    title="e-Agriculture API",
    description="Ingestion, storage, and analytics for MAXIQ sensor data.",
    version="1.0.0",
)

Base.metadata.create_all(bind=engine)


# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # Replace with your React app's URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.post("/ingest", response_model=IngestResponse, status_code=201)
def ingest(payload: SensorReadingIn, db: Session = Depends(get_db)):
    """
    Receives sensor JSON from the Raspberry Pi bridge.
    Stores all fields, runs anomaly detection, returns flags.
    """
    reading = SensorReading(
        device=payload.device,
        timestamp=payload.timestamp,
        temperature=payload.temperature,
        humidity=payload.humidity,
        soil_moisture=payload.soil_moisture,
        lux=payload.lux,
        uvi=payload.uvi,
        uv_status=payload.uv_status,
        soil_status=payload.soil_status,
        wifi_rssi=payload.wifi_rssi,
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    anomalies = detect_anomalies(reading)

    return IngestResponse(
        status="ok",
        id=reading.id,
        anomalies=anomalies,
    )


@app.get("/analytics", response_model=AnalyticsResponse)
def analytics(db: Session = Depends(get_db)):
    """
    Returns per-sensor averages + anomaly flags on the latest reading.
    """
    return AnalyticsResponse(
        averages=compute_averages(db),
        latest_anomalies=get_latest_anomalies(db),
    )


@app.get("/readings", response_model=List[SensorReadingOut])
def readings(limit: int = 100, db: Session = Depends(get_db)):
    """
    Returns the most recent `limit` readings in ascending order.
    Use ?limit=N to control how many are returned (max 1000).
    """
    if limit < 1 or limit > 1000:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 1000")

    results = (
        db.query(SensorReading)
        .order_by(SensorReading.created_at.desc())
        .limit(limit)
        .all()
    )

    return list(reversed(results))


@app.get("/health")
def health():
    """Health check — verify the API is reachable from the RPi."""
    return {"status": "ok"}