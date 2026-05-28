from sqlalchemy import Column, Integer, Float, DateTime, String
from sqlalchemy.sql import func
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

from database import Base


# ── ORM Model (maps to Neon PostgreSQL table) ──────────────────────────────────

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id            = Column(Integer, primary_key=True, index=True)
    created_at    = Column(DateTime, default=func.now(), nullable=False)  # server insert time

    # Device metadata
    device        = Column(String, nullable=True)
    timestamp     = Column(Integer, nullable=True)   # device uptime in ms

    # Sensor values
    temperature   = Column(Float, nullable=False)    # °C
    humidity      = Column(Float, nullable=False)    # %
    soil_moisture = Column(Float, nullable=False)    # % (raw value from kit)
    lux           = Column(Float, nullable=False)    # light intensity in lux
    uvi           = Column(Float, nullable=True)     # UV index

    # Status strings
    uv_status     = Column(String, nullable=True)    # e.g. "LOW", "HIGH"
    soil_status   = Column(String, nullable=True)    # e.g. "DRY", "WET"

    # Network
    wifi_rssi     = Column(Integer, nullable=True)   # dBm


# ── Pydantic Schemas ───────────────────────────────────────────────────────────

class SensorReadingIn(BaseModel):
    """Exact shape of the JSON the MAXIQ kit transmits."""
    device:        Optional[str]   = Field(None)
    timestamp:     Optional[int]   = Field(None,  description="Device uptime in ms")

    temperature:   float           = Field(...,   description="Temperature in °C")
    humidity:      float           = Field(...,   description="Relative humidity in %")
    soil_moisture: float           = Field(...,   description="Soil moisture raw value")
    lux:           float           = Field(...,   description="Light intensity in lux")
    uvi:           Optional[float] = Field(None,  description="UV index")

    uv_status:     Optional[str]   = Field(None,  description="UV status string e.g. LOW")
    soil_status:   Optional[str]   = Field(None,  description="Soil status string e.g. DRY")
    wifi_rssi:     Optional[int]   = Field(None,  description="WiFi signal strength in dBm")


class AnomalyFlags(BaseModel):
    """True = anomaly detected for that sensor field."""
    temperature:   bool
    humidity:      bool
    soil_moisture: bool
    lux:           bool


class IngestResponse(BaseModel):
    """Response returned after a successful POST /ingest."""
    status:    str
    id:        int
    anomalies: AnomalyFlags


class SensorReadingOut(BaseModel):
    """Single reading returned by GET /readings."""
    id:            int
    created_at:    datetime
    device:        Optional[str]
    timestamp:     Optional[int]
    temperature:   float
    humidity:      float
    soil_moisture: float
    lux:           float
    uvi:           Optional[float]
    uv_status:     Optional[str]
    soil_status:   Optional[str]
    wifi_rssi:     Optional[int]

    class Config:
        from_attributes = True  # Pydantic v2 — allows ORM → schema conversion


class Averages(BaseModel):
    """Per-sensor averages over all stored readings."""
    temperature:   Optional[float]
    humidity:      Optional[float]
    soil_moisture: Optional[float]
    lux:           Optional[float]


class LatestAnomalies(BaseModel):
    """Anomaly flags computed on the most recent reading."""
    reading_id: Optional[int]
    flags:      Optional[AnomalyFlags]
    message:    str


class AnalyticsResponse(BaseModel):
    """Full analytics payload returned by GET /analytics."""
    averages:         Averages
    latest_anomalies: LatestAnomalies