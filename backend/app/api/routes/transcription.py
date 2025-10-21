from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List, Dict, Any
import uuid
from datetime import datetime

from app.models.schemas import TranscriptionSession, TranscriptionSegment
from app.core.database import get_database
from app.api.routes.auth import get_current_user
from app.services.transcription_service import TranscriptionService

router = APIRouter()
transcription_service = TranscriptionService()

@router.post("/sessions", response_model=TranscriptionSession)
async def create_transcription_session(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Create a new transcription session"""
    db = get_database()
    
    session_id = str(uuid.uuid4())
    session_data = {
        "session_id": session_id,
        "user_id": str(current_user["_id"]),
        "patient_id": patient_id,
        "start_time": datetime.utcnow(),
        "status": "active",
        "transcription_segments": []
    }
    
    result = await db.transcription_sessions.insert_one(session_data)
    created_session = await db.transcription_sessions.find_one({"_id": result.inserted_id})
    
    return TranscriptionSession(**created_session)

@router.get("/sessions", response_model=List[TranscriptionSession])
async def get_user_sessions(
    current_user: dict = Depends(get_current_user)
):
    """Get all transcription sessions for current user"""
    db = get_database()
    
    sessions = await db.transcription_sessions.find({
        "user_id": str(current_user["_id"])
    }).sort("start_time", -1).to_list(length=100)
    
    return [TranscriptionSession(**session) for session in sessions]

@router.get("/sessions/{session_id}", response_model=TranscriptionSession)
async def get_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specific transcription session"""
    db = get_database()
    
    session = await db.transcription_sessions.find_one({
        "session_id": session_id,
        "user_id": str(current_user["_id"])
    })
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return TranscriptionSession(**session)

@router.put("/sessions/{session_id}/end")
async def end_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """End a transcription session"""
    db = get_database()
    
    result = await db.transcription_sessions.update_one(
        {
            "session_id": session_id,
            "user_id": str(current_user["_id"])
        },
        {
            "$set": {
                "end_time": datetime.utcnow(),
                "status": "completed"
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return {"message": "Session ended successfully"}

@router.post("/sessions/{session_id}/upload-audio")
async def upload_audio_file(
    session_id: str,
    audio_file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload and process audio file for transcription"""
    db = get_database()
    
    # Verify session ownership
    session = await db.transcription_sessions.find_one({
        "session_id": session_id,
        "user_id": str(current_user["_id"])
    })
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    try:
        # Read audio file
        audio_content = await audio_file.read()
        
        # Process audio through transcription service
        result = await transcription_service.process_audio_chunk(audio_content, session_id)
        
        if result:
            # Store transcription segment
            segment_data = {
                "text": result["text"],
                "speaker": result["speaker"],
                "confidence": result["confidence"],
                "timestamp": datetime.utcnow(),
                "start_time": 0.0,
                "end_time": 10.0  # Placeholder for actual audio duration
            }
            
            await db.transcription_sessions.update_one(
                {"session_id": session_id},
                {"$push": {"transcription_segments": segment_data}}
            )
        
        return {
            "message": "Audio processed successfully",
            "transcription": result
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing audio: {str(e)}"
        )

@router.get("/sessions/{session_id}/transcript")
async def get_session_transcript(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get full transcript for a session"""
    db = get_database()
    
    session = await db.transcription_sessions.find_one({
        "session_id": session_id,
        "user_id": str(current_user["_id"])
    })
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Format transcript
    transcript = []
    for segment in session.get("transcription_segments", []):
        transcript.append({
            "speaker": segment["speaker"],
            "text": segment["text"],
            "timestamp": segment["timestamp"],
            "confidence": segment["confidence"]
        })
    
    return {
        "session_id": session_id,
        "transcript": transcript,
        "total_segments": len(transcript)
    }

@router.post("/sessions/{session_id}/analyze")
async def analyze_transcription(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Analyze transcription for medical terms and insights"""
    db = get_database()
    
    session = await db.transcription_sessions.find_one({
        "session_id": session_id,
        "user_id": str(current_user["_id"])
    })
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    try:
        # Analyze transcription segments for medical terms
        analysis_results = {
            "medical_terms": [],
            "speaker_statistics": {"doctor": 0, "patient": 0, "unknown": 0},
            "session_summary": "",
            "confidence_average": 0.0
        }
        
        total_confidence = 0
        segment_count = 0
        
        for segment in session.get("transcription_segments", []):
            # Count speaker statistics
            speaker = segment.get("speaker", "unknown")
            analysis_results["speaker_statistics"][speaker] = (
                analysis_results["speaker_statistics"].get(speaker, 0) + 1
            )
            
            # Calculate confidence average
            confidence = segment.get("confidence", 0.0)
            total_confidence += confidence
            segment_count += 1
            
            # Extract medical terms (simplified)
            text = segment.get("text", "").lower()
            medical_keywords = ["pain", "fever", "nausea", "headache", "diagnosis", "treatment", "medication"]
            
            for keyword in medical_keywords:
                if keyword in text:
                    analysis_results["medical_terms"].append({
                        "term": keyword,
                        "context": segment.get("text", ""),
                        "speaker": speaker,
                        "confidence": confidence
                    })
        
        if segment_count > 0:
            analysis_results["confidence_average"] = total_confidence / segment_count
        
        # Generate session summary
        analysis_results["session_summary"] = f"Session with {segment_count} transcription segments. " \
                                             f"Average confidence: {analysis_results['confidence_average']:.2f}"
        
        return analysis_results
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing transcription: {str(e)}"
        )