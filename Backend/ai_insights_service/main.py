import logging
import time
from sqlalchemy.exc import OperationalError
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import engine, get_db, Base
from models.insight import AIInsight
from models.sensor_reading import SensorReading
from services.ai_engine import AIEngine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AI-Insights-Service")

app = FastAPI(
    title="E-Agri AI Insights Service",
    description="Refactored AI Insights Service with 3 core endpoints.",
    version="2.0.0"
)

# Robust database initialization
def init_db():
    retries = 5
    while retries > 0:
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("Successfully connected to the database and created tables.")
            break
        except OperationalError as e:
            retries -= 1
            logger.warning(f"Database connection failed. Retrying in 5 seconds... ({retries} retries left)")
            time.sleep(5)
    if retries == 0:
        logger.error("Could not connect to the database after multiple attempts.")

@app.on_event("startup")
def startup_event():
    init_db()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI Engine
try:
    ai_engine = AIEngine()
except Exception as e:
    logger.error(f"Failed to initialize AI Engine: {e}")
    ai_engine = None

# --- The Core Endpoints ---

@app.post("/insights/generate-and-store/{reading_id}", status_code=201)
def generate_and_store_insight(reading_id: int, db: Session = Depends(get_db)):
    """
    COMBINED ENDPOINT:
    1. Fetches sensor readings for the given ID.
    2. Sends data to AI for analysis.
    3. Automatically stores the AI response in the database.
    """
    if not ai_engine:
        raise HTTPException(status_code=500, detail="AI Engine not configured. Check GROQ_API_KEY.")

    # 1. Fetch Reading
    reading = db.query(SensorReading).filter(SensorReading.id == reading_id).first()
    if not reading:
        raise HTTPException(status_code=404, detail=f"Sensor reading with ID {reading_id} not found.")

    try:
        # 2. Prepare data for AI
        reading_data = {
            "device": reading.device,
            "timestamp": reading.timestamp,
            "temperature": reading.temperature,
            "humidity": reading.humidity,
            "soil_moisture": reading.soil_moisture,
            "lux": reading.lux,
            "uvi": reading.uvi,
            "uv_status": reading.uv_status,
            "soil_status": reading.soil_status,
            "wifi_rssi": reading.wifi_rssi
        }

        # 3. Generate insight using Groq
        ai_results = ai_engine.generate_insight(reading_data)

        # 4. Store in Database
        new_insight = AIInsight(
            reading_id=reading.id,
            device=reading.device,
            category=ai_results.get("category", "General"),
            priority=ai_results.get("priority", "Medium"),
            recommendation=ai_results.get("recommendation", "No specific recommendation."),
            sector_identified=ai_results.get("sector_identified", "Unknown"),
            sector_breakdown=ai_results.get("sector_breakdown"),
            raw_analysis=ai_results
        )
        
        db.add(new_insight)
        db.commit()
        db.refresh(new_insight)

        return {
            "message": "Insight generated and stored successfully",
            "insight": new_insight
        }

    except Exception as e:
        logger.error(f"Failed to process insight for reading {reading_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Process failed: {str(e)}")


@app.get("/insights")
def fetch_insights_from_db(limit: int = 10, db: Session = Depends(get_db)):
    """
    ENDPOINT 3: FETCH THE INSIGHTS FROM THE DATABASE AND DISPLAY IS
    - Fetches stored insights from the 'ai_insights' table.
    """
    try:
        insights = db.query(AIInsight).order_by(AIInsight.created_at.desc()).limit(limit).all()
        return insights
    except Exception as e:
        logger.error(f"Failed to fetch insights: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch insights from database.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
