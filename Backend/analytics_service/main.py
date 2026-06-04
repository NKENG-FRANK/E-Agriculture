from dotenv import load_dotenv
load_dotenv()  # Loads DATABASE_URL from .env before database.py reads it

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List,Optional

from database import engine, get_db, Base
from models import (
    SensorReading,
    SensorReadingIn,
    SensorReadingOut,
    IngestResponse,
    AnalyticsResponse,
)
from analytics import compute_averages, detect_anomalies, get_latest_anomalies

import time
from sqlalchemy.exc import OperationalError

# ── App Init ──────────────────────────────────────────────────────────────────

app = FastAPI(
    title="e-Agriculture API",
    description="Ingestion, storage, and analytics for MAXIQ sensor data.",
    version="1.0.0",
)

# Robust database initialization
def init_db():
    retries = 5
    while retries > 0:
        try:
            Base.metadata.create_all(bind=engine)
            print("Successfully connected to the database and created tables.")
            break
        except OperationalError as e:
            retries -= 1
            print(f"Database connection failed. Retrying in 5 seconds... ({retries} retries left)")
            time.sleep(5)
    if retries == 0:
        print("Could not connect to the database after multiple attempts.")

@app.on_event("startup")
def startup_event():
    init_db()


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
    Receives sensor JSON.
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
        farm_id=payload.farm_id
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


@app.get("/devices",response_model=List[str])
def devices(db:Session = Depends(get_db)):
    rows = db.query(distinct(SensorReading.device)).filter(SensorReading.device.isnot(None)).all()
    return sorted([row[0]for row in rows])


@app.get("/analytics", response_model=AnalyticsResponse)
def analytics( devices: Optional[str]= Query(None,description="Filter by device name"),
               db: Session = Depends(get_db)):
    """
    Returns per-sensor averages + anomaly flags on the latest reading.
    """
    return AnalyticsResponse(
        averages=compute_averages(db,devices=devices),
        latest_anomalies=get_latest_anomalies(db,devices=devices),
    )


@app.get("/readings", response_model=List[SensorReadingOut])
def readings(limit: int = 100, device: Optional[str] = Query(None, description="Filter by device name"), db: Session = Depends(get_db)):
    """
    Returns the most recent `limit` readings in ascending order.
    Use ?limit=N to control how many are returned (max 1000).
    """
    if limit < 1 or limit > 1000:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 1000")

    query = db.query(SensorReading)

    if device:
        query = query.filter(SensorReading.device == device)
    results = (
        query
        .order_by(SensorReading.created_at.desc())
        .limit(limit)
        .all()
    )

    return list(reversed(results))


@app.get("/health")
def health():
    """Health check — verify the API is reachable from the RPi."""
    return {"status": "ok"}