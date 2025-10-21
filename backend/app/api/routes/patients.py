from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from datetime import datetime

from app.models.schemas import Patient
from app.core.database import get_database
from app.api.routes.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=Patient)
async def create_patient(
    patient_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Create a new patient record"""
    db = get_database()
    
    # Check if patient already exists
    existing_patient = await db.patients.find_one({
        "medical_record_number": patient_data.get("medical_record_number")
    })
    
    if existing_patient:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient with this medical record number already exists"
        )
    
    # Create patient record
    patient_record = {
        "patient_id": patient_data.get("patient_id"),
        "first_name": patient_data.get("first_name"),
        "last_name": patient_data.get("last_name"),
        "date_of_birth": datetime.fromisoformat(patient_data.get("date_of_birth")),
        "gender": patient_data.get("gender"),
        "medical_record_number": patient_data.get("medical_record_number"),
        "phone": patient_data.get("phone"),
        "email": patient_data.get("email"),
        "emergency_contact": patient_data.get("emergency_contact", {}),
        "created_at": datetime.utcnow(),
        "created_by": str(current_user["_id"])
    }
    
    result = await db.patients.insert_one(patient_record)
    created_patient = await db.patients.find_one({"_id": result.inserted_id})
    
    return Patient(**created_patient)

@router.get("/", response_model=List[Patient])
async def get_patients(
    search: str = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get patients list with optional search"""
    db = get_database()
    
    query = {}
    
    if search:
        # Search by name or medical record number
        query["$or"] = [
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}},
            {"medical_record_number": {"$regex": search, "$options": "i"}}
        ]
    
    patients = await db.patients.find(query).limit(limit).sort("last_name", 1).to_list(length=limit)
    
    return [Patient(**patient) for patient in patients]

@router.get("/{patient_id}", response_model=Patient)
async def get_patient(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specific patient by ID"""
    db = get_database()
    
    from bson import ObjectId
    
    try:
        patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        return Patient(**patient)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid patient ID: {str(e)}"
        )

@router.put("/{patient_id}", response_model=Patient)
async def update_patient(
    patient_id: str,
    update_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Update patient information"""
    db = get_database()
    
    from bson import ObjectId
    
    try:
        # Verify patient exists
        patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Allowed fields for update
        allowed_fields = [
            "first_name", "last_name", "phone", "email", 
            "emergency_contact", "gender"
        ]
        
        update_fields = {k: v for k, v in update_data.items() if k in allowed_fields}
        update_fields["updated_at"] = datetime.utcnow()
        
        await db.patients.update_one(
            {"_id": ObjectId(patient_id)},
            {"$set": update_fields}
        )
        
        updated_patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
        return Patient(**updated_patient)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error updating patient: {str(e)}"
        )

@router.get("/{patient_id}/notes")
async def get_patient_notes(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all SOAP notes for a patient"""
    db = get_database()
    
    from bson import ObjectId
    
    try:
        # Verify patient exists
        patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Get SOAP notes for this patient
        notes = await db.soap_notes.find({
            "patient_id": patient_id
        }).sort("created_at", -1).to_list(length=100)
        
        return {
            "patient_id": patient_id,
            "patient_name": f"{patient['first_name']} {patient['last_name']}",
            "notes": notes,
            "total_notes": len(notes)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error retrieving patient notes: {str(e)}"
        )

@router.get("/{patient_id}/sessions")
async def get_patient_sessions(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all transcription sessions for a patient"""
    db = get_database()
    
    from bson import ObjectId
    
    try:
        # Verify patient exists
        patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Get transcription sessions for this patient
        sessions = await db.transcription_sessions.find({
            "patient_id": patient_id
        }).sort("start_time", -1).to_list(length=100)
        
        return {
            "patient_id": patient_id,
            "patient_name": f"{patient['first_name']} {patient['last_name']}",
            "sessions": sessions,
            "total_sessions": len(sessions)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error retrieving patient sessions: {str(e)}"
        )