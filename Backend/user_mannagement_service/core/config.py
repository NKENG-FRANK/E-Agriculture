from pathlib import Path

from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str 
    SUPABASE_ANON_KEY: str
    SUPABASE_JWT_SECRET:str 
    USE_REDIS: bool = False
    ALLOW_EMPTY_PASSWORD: str = "yes"
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    
    # JWT
    ACCESS_TOKEN_EXPIRE_MINUTES: int = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 15)
    REFRESH_TOKEN_EXPIRE_DAYS: int = os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7)
    
    # App
    APP_NAME: str = "My_Auth_Service"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    
    class Config:
        env_file = Path(__file__).parent.parent.parent / ".env"
        env_file_encoding = "utf-8"
        extra = "ignore" 

settings = Settings()