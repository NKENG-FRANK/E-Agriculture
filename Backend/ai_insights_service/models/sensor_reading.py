from sqlalchemy import Column, Integer, Float, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from database import Base

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id            = Column(Integer, primary_key=True, index=True)
    created_at    = Column(DateTime, default=func.now(), nullable=False)
    device        = Column(String, nullable=True)
    timestamp     = Column(Integer, nullable=True)
    temperature   = Column(Float, nullable=False)
    humidity      = Column(Float, nullable=False)
    soil_moisture = Column(Float, nullable=False)
    lux           = Column(Float, nullable=False)
    uvi           = Column(Float, nullable=True)
    uv_status     = Column(String, nullable=True)
    soil_status   = Column(String, nullable=True)
    wifi_rssi     = Column(Integer, nullable=True)
    farm_id       = Column(UUID(as_uuid=True), nullable=True)
