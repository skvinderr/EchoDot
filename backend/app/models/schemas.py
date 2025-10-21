from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class User(BaseModel):
    """Healthcare professional user model"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    email: EmailStr
    full_name: str
    license_number: str  # Medical license number
    specialty: str
    organization: str
    role: str = "doctor"  # doctor, nurse, admin
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    license_number: str
    specialty: str
    organization: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class Patient(BaseModel):
    """Patient information model"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    patient_id: str  # External patient ID
    first_name: str
    last_name: str
    date_of_birth: datetime
    gender: str
    medical_record_number: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    emergency_contact: Optional[Dict[str, str]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class TranscriptionSession(BaseModel):
    """Real-time transcription session"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    session_id: str
    user_id: str  # Doctor/healthcare professional
    patient_id: str
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    status: str = "active"  # active, completed, cancelled
    audio_file_path: Optional[str] = None
    transcription_segments: List[Dict[str, Any]] = []
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class TranscriptionSegment(BaseModel):
    """Individual transcription segment"""
    text: str
    speaker: str  # doctor, patient, unknown
    confidence: float
    start_time: float
    end_time: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class SOAPNote(BaseModel):
    """SOAP (Subjective, Objective, Assessment, Plan) note model"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    session_id: str
    patient_id: str
    user_id: str  # Doctor who created/approved the note
    
    # SOAP Components
    subjective: str = ""  # Patient's description of symptoms
    objective: str = ""   # Observable facts and measurements
    assessment: str = ""  # Diagnosis or clinical impression
    plan: str = ""       # Treatment plan and follow-up
    
    # Additional fields
    chief_complaint: str = ""
    history_of_present_illness: str = ""
    medications: List[str] = []
    allergies: List[str] = []
    vital_signs: Dict[str, str] = {}
    
    # Workflow
    status: str = "draft"  # draft, pending_review, approved, signed
    confidence_score: float = 0.0
    ai_generated: bool = True
    human_reviewed: bool = False
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    signed_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class MedicalTerm(BaseModel):
    """Medical terminology and concepts"""
    term: str
    category: str  # symptom, medication, diagnosis, procedure
    confidence: float
    context: str
    
class SpeakerIdentification(BaseModel):
    """Speaker identification result"""
    speaker_id: str
    speaker_type: str  # doctor, patient, other
    confidence: float
    voice_print: Optional[Dict[str, Any]] = None