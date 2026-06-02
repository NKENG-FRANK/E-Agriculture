from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from database import Base

class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    
    # Reference to the sensor reading that triggered this insight
    reading_id = Column(Integer, index=True) 
    device = Column(String, index=True)
    
    # AI generated content
    category = Column(String)  # e.g., "Irrigation", "Health", "Climate"
    priority = Column(String)  # e.g., "Low", "Medium", "High"
    recommendation = Column(String, nullable=False)
    sector_breakdown = Column(JSON) # Detailed analysis per metric
    raw_analysis = Column(JSON)  # Store detailed model output if needed
    sector_identified = Column(String(255)) # The sector the AI identified (Plant, Poultry, Pond)
