from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # Resend
    RESEND_API_KEY: str
    RESEND_FROM_EMAIL: str = "onboarding@resend.dev"

    # Redis
    REDIS_URL: str

    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # Frontend URLs
    SIGNUP_URL: str = "http://localhost:5173/register"
    ANALYTICS_URL: str = "http://localhost:8000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()