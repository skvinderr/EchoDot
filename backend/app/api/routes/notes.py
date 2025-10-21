from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from datetime import datetime

from app.models.schemas import SOAPNote, Patient
from app.core.database import get_database
from app.api.routes.auth import get_current_user
from app.services.transcription_service import TranscriptionService

router = APIRouter()
transcription_service = TranscriptionService()

@router.post("/generate/{session_id}", response_model=SOAPNote)
async def generate_soap_note(
    session_id: str,
    patient_info: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Generate SOAP note from transcription session"""
    db = get_database()
    
    # Verify session exists and belongs to user
    session = await db.transcription_sessions.find_one({
        "session_id": session_id,
        "user_id": str(current_user["_id"])
    })
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcription session not found"
        )
    
    try:
        # Generate SOAP note using AI service
        soap_data = await transcription_service.generate_soap_note(session_id, patient_info)
        
        if "error" in soap_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=soap_data["error"]
            )
        
        # Create SOAP note document
        note_data = {
            "session_id": session_id,
            "patient_id": session["patient_id"],
            "user_id": str(current_user["_id"]),
            "subjective": soap_data.get("subjective", ""),
            "objective": soap_data.get("objective", ""),
            "assessment": soap_data.get("assessment", ""),
            "plan": soap_data.get("plan", ""),
            "chief_complaint": soap_data.get("chief_complaint", ""),
            "history_of_present_illness": soap_data.get("history_of_present_illness", ""),
            "medications": soap_data.get("medications", []),
            "allergies": soap_data.get("allergies", []),
            "vital_signs": soap_data.get("vital_signs", {}),
            "status": "draft",
            "confidence_score": soap_data.get("confidence_score", 0.8),
            "ai_generated": True,
            "human_reviewed": False,
            "created_at": datetime.utcnow()
        }
        
        result = await db.soap_notes.insert_one(note_data)
        created_note = await db.soap_notes.find_one({"_id": result.inserted_id})
        
        return SOAPNote(**created_note)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating SOAP note: {str(e)}"
        )

@router.get("/", response_model=List[SOAPNote])
async def get_soap_notes(
    patient_id: str = None,
    status_filter: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Get SOAP notes for current user"""
    db = get_database()
    
    # Build query filter
    query = {"user_id": str(current_user["_id"])}
    
    if patient_id:
        query["patient_id"] = patient_id
    
    if status_filter:
        query["status"] = status_filter
    
    notes = await db.soap_notes.find(query).sort("created_at", -1).to_list(length=100)
    
    return [SOAPNote(**note) for note in notes]

@router.get("/{note_id}", response_model=SOAPNote)
async def get_soap_note(
    note_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specific SOAP note"""
    db = get_database()
    
    from bson import ObjectId
    
    try:
        note = await db.soap_notes.find_one({
            "_id": ObjectId(note_id),
            "user_id": str(current_user["_id"])
        })
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="SOAP note not found"
            )
        
        return SOAPNote(**note)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid note ID: {str(e)}"
        )

@router.put("/{note_id}", response_model=SOAPNote)
async def update_soap_note(
    note_id: str,
    update_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Update SOAP note"""
    db = get_database()
    
    from bson import ObjectId
    
    try:
        # Verify note exists and belongs to user
        note = await db.soap_notes.find_one({
            "_id": ObjectId(note_id),
            "user_id": str(current_user["_id"])
        })
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="SOAP note not found"
            )
        
        # Allowed fields for update
        allowed_fields = [
            "subjective", "objective", "assessment", "plan",
            "chief_complaint", "history_of_present_illness",
            "medications", "allergies", "vital_signs", "status"
        ]
        
        update_fields = {k: v for k, v in update_data.items() if k in allowed_fields}
        update_fields["updated_at"] = datetime.utcnow()
        
        # Mark as human reviewed if content is modified
        if any(field in update_fields for field in ["subjective", "objective", "assessment", "plan"]):
            update_fields["human_reviewed"] = True
        
        await db.soap_notes.update_one(
            {"_id": ObjectId(note_id)},
            {"$set": update_fields}
        )
        
        updated_note = await db.soap_notes.find_one({"_id": ObjectId(note_id)})
        return SOAPNote(**updated_note)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error updating note: {str(e)}"
        )

@router.post("/{note_id}/approve")
async def approve_soap_note(
    note_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Approve and sign SOAP note"""
    db = get_database()
    
    from bson import ObjectId
    
    try:
        result = await db.soap_notes.update_one(
            {
                "_id": ObjectId(note_id),
                "user_id": str(current_user["_id"])
            },
            {
                "$set": {
                    "status": "approved",
                    "human_reviewed": True,
                    "signed_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="SOAP note not found"
            )
        
        return {"message": "SOAP note approved and signed successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error approving note: {str(e)}"
        )

@router.delete("/{note_id}")
async def delete_soap_note(
    note_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete SOAP note"""
    db = get_database()
    
    from bson import ObjectId
    
    try:
        result = await db.soap_notes.delete_one({
            "_id": ObjectId(note_id),
            "user_id": str(current_user["_id"])
        })
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="SOAP note not found"
            )
        
        return {"message": "SOAP note deleted successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error deleting note: {str(e)}"
        )