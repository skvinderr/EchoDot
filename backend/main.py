from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import logging
import os
from dotenv import load_dotenv

from app.api.routes import auth, transcription, notes, patients
from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.services.websocket_manager import WebSocketManager
from app.services.transcription_service import TranscriptionService

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# WebSocket manager instance
websocket_manager = WebSocketManager()
transcription_service = TranscriptionService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up AI Medical Scribe...")
    await connect_to_mongo()
    yield
    # Shutdown
    logger.info("Shutting down AI Medical Scribe...")
    await close_mongo_connection()

app = FastAPI(
    title="AI Medical Scribe",
    description="AI-powered ambient scribe for automated medical documentation",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(auth.router, prefix="/api/v1", tags=["authentication"])
app.include_router(transcription.router, prefix="/api/v1", tags=["transcription"])
app.include_router(notes.router, prefix="/api/v1", tags=["notes"])
app.include_router(patients.router, prefix="/api/v1", tags=["patients"])

@app.get("/")
async def root():
    return {"message": "AI Medical Scribe API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "AI Medical Scribe"}

@app.websocket("/ws/transcription/{session_id}")
async def websocket_transcription(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time transcription"""
    await websocket_manager.connect(websocket, session_id)
    try:
        while True:
            # Receive audio data from client
            audio_data = await websocket.receive_bytes()
            
            # Process audio through transcription service
            result = await transcription_service.process_audio_chunk(audio_data, session_id)
            
            if result:
                # Send transcription result back to client
                await websocket_manager.send_to_session(session_id, {
                    "type": "transcription",
                    "text": result.get("text", ""),
                    "speaker": result.get("speaker", "unknown"),
                    "confidence": result.get("confidence", 0.0),
                    "timestamp": result.get("timestamp", "")
                })
                
    except WebSocketDisconnect:
        await websocket_manager.disconnect(session_id)
        logger.info(f"WebSocket disconnected for session: {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error for session {session_id}: {str(e)}")
        await websocket_manager.disconnect(session_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )