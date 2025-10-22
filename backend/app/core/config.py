from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AI Medical Scribe"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    ALGORITHM: str = "HS256"
    
    # Database
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "medical_scribe")
    
    # AI Services
    GOOGLE_API_KEY: Optional[str] = os.getenv("GOOGLE_API_KEY")
    
    # Audio Processing
    AUDIO_CHUNK_SIZE: int = 1024
    AUDIO_FORMAT: str = "wav"
    SAMPLE_RATE: int = 16000
    
    # Healthcare Compliance
    HIPAA_ENCRYPTION_KEY: Optional[str] = os.getenv("HIPAA_ENCRYPTION_KEY")
    DATA_RETENTION_DAYS: int = 90
    
    # CORS
    BACKEND_CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://localhost:3000",
        "https://127.0.0.1:3000",
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()