from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from models import SensorReading, AnomalyFlags, Averages, LatestAnomalies
from Threshold import THRESHOLDS


# ── Helpers ───────────────────────────────────────────────────────────────────

def _is_anomaly(field: str, value: float) -> bool:
    """Return True if value is outside the fixed threshold range for this field."""
    bounds = THRESHOLDS[field]
    return value < bounds["min"] or value > bounds["max"]


def filter_query(db: Session, device: Optional[str]):
    """Return a query scoped to a device if provided, otherwise all devices."""
    q = db.query(SensorReading)
    if device:
        q = q.filter(SensorReading.device == device)
    return q
# ── Public Functions ──────────────────────────────────────────────────────────

def compute_averages(db: Session,device:Optional[str]=None) -> Averages:
    """
    Return the mean value for each sensor field across ALL stored readings.
    Returns None per field if no data exists.
    """
    result = filter_query(db,device).with_entities(func.avg(Averages.reading))(
        func.avg(SensorReading.temperature).label("temperature"),
        func.avg(SensorReading.humidity).label("humidity"),
        func.avg(SensorReading.soil_moisture).label("soil_moisture"),
        func.avg(SensorReading.lux).label("lux"),
    ).one()

    return Averages(
        temperature=round(result.temperature, 2) if result.temperature is not None else None,
        humidity=round(result.humidity, 2) if result.humidity is not None else None,
        soil_moisture=round(result.soil_moisture, 2) if result.soil_moisture is not None else None,
        lux=round(result.lux, 2) if result.lux is not None else None,
    )


def detect_anomalies(reading: SensorReading) -> AnomalyFlags:
    """
    Compare a single SensorReading against fixed thresholds.
    Returns AnomalyFlags with True/False per sensor field.
    """
    return AnomalyFlags(
        temperature=_is_anomaly("temperature", reading.temperature),
        humidity=_is_anomaly("humidity", reading.humidity),
        soil_moisture=_is_anomaly("soil_moisture", reading.soil_moisture),
        lux=_is_anomaly("lux", reading.lux),
    )


def get_latest_anomalies(db: Session,device:Optional[str]=None) -> LatestAnomalies:
    """
    Fetch the most recent reading and run anomaly detection on it.
    Gracefully handles an empty DB.
    """
    latest = (
        filter_query(db, device)
        .order_by(SensorReading.created_at.desc())
        .first()
    )

    if latest is None:
        return LatestAnomalies(
            reading_id=None,
            flags=None,
            message="No readings in the database yet."
        )

    flags = detect_anomalies(latest)
    any_anomaly = any([
        flags.temperature,
        flags.humidity,
        flags.soil_moisture,
        flags.lux,
    ])

    return LatestAnomalies(
        reading_id=latest.id,
        flags=flags,
        message=f"{' Anomaly detected' if any_anomaly else ' All values normal'} on reading #{latest.id}"
    )