from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Dict, Any, Annotated
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_json_schema__(cls, _source_type, _handler):
        return {"type": "string"}
    
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

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
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

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
    patient_id: str  # Unique patient identifier
    first_name: str
    last_name: str
    date_of_birth: datetime
    gender: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    emergency_contact: Optional[Dict[str, str]] = None
    insurance_info: Optional[Dict[str, str]] = None
    medical_record_number: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    created_by: PyObjectId  # Doctor who created the record
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class TranscriptionSession(BaseModel):
    """Audio transcription session model"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    session_id: str
    patient_id: PyObjectId
    doctor_id: PyObjectId
    session_type: str  # consultation, follow-up, procedure, etc.
    start_time: datetime
    end_time: Optional[datetime] = None
    status: str = "active"  # active, completed, paused
    raw_transcription: List[Dict[str, Any]] = []
    processed_transcription: Optional[str] = None
    confidence_scores: Dict[str, float] = {}
    speaker_identification: Dict[str, str] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class SOAPNote(BaseModel):
    """SOAP note model for medical documentation"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    patient_id: PyObjectId
    doctor_id: PyObjectId
    session_id: Optional[PyObjectId] = None
    
    # SOAP Components
    subjective: str  # Patient's complaints and symptoms
    objective: str   # Observable findings and test results
    assessment: str  # Diagnosis and clinical judgment
    plan: str       # Treatment plan and follow-up
    
    # Additional fields
    chief_complaint: str
    medical_terms: List[str] = []
    medications_mentioned: List[str] = []
    procedures_mentioned: List[str] = []
    
    # Metadata
    date_of_service: datetime
    encounter_type: str  # consultation, follow-up, procedure, etc.
    status: str = "draft"  # draft, reviewed, finalized
    confidence_score: float = 0.0
    
    # Audit trail
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    reviewed_by: Optional[PyObjectId] = None
    reviewed_at: Optional[datetime] = None
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class SOAPNoteCreate(BaseModel):
    patient_id: str
    session_id: Optional[str] = None
    chief_complaint: str
    encounter_type: str = "consultation"

class SOAPNoteUpdate(BaseModel):
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    status: Optional[str] = None

class TranscriptionResult(BaseModel):
    """Real-time transcription result"""
    text: str
    confidence: float
    speaker: str  # doctor, patient
    timestamp: datetime
    is_final: bool = False

class AudioChunk(BaseModel):
    """Audio data chunk for processing"""
    session_id: str
    audio_data: str  # Base64 encoded audio
    timestamp: datetime
    chunk_id: int

class TranscriptionSegment(BaseModel):
    """Individual transcription segment"""
    text: str
    confidence: float
    start_time: float
    end_time: float
    speaker: str