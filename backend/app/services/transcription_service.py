import google.generativeai as genai
import speech_recognition as sr
import io
import wave
import numpy as np
import librosa
from typing import Dict, Any, Optional, List
import logging
from datetime import datetime
import asyncio
import json
from app.core.config import settings

logger = logging.getLogger(__name__)

class TranscriptionService:
    """Service for real-time audio transcription and processing"""
    
    def __init__(self):
        self.gemini_model = None
        self.speech_recognizer = sr.Recognizer()
        self.active_sessions: Dict[str, Dict] = {}
        
        # Initialize AI services
        self._initialize_services()
    
    def _initialize_services(self):
        """Initialize Google AI services"""
        try:
            if settings.GOOGLE_API_KEY:
                genai.configure(api_key=settings.GOOGLE_API_KEY)
                self.gemini_model = genai.GenerativeModel('gemini-2.5-flash')
                logger.info("Google Gemini 2.5 Flash initialized successfully")
            else:
                logger.error("Google API key not found. Please set GOOGLE_API_KEY in environment variables.")
                
        except Exception as e:
            logger.error(f"Error initializing AI services: {e}")
    
    async def process_audio_chunk(self, audio_data: bytes, session_id: str) -> Optional[Dict[str, Any]]:
        """Process incoming audio chunk and return transcription"""
        try:
            # Initialize session if not exists
            if session_id not in self.active_sessions:
                self.active_sessions[session_id] = {
                    "audio_buffer": b"",
                    "transcription_history": [],
                    "speaker_profiles": {},
                    "last_processed": datetime.utcnow()
                }
            
            session = self.active_sessions[session_id]
            session["audio_buffer"] += audio_data
            
            # Process audio when buffer is large enough
            if len(session["audio_buffer"]) >= settings.AUDIO_CHUNK_SIZE * 16:  # ~1 second of audio
                result = await self._transcribe_audio(session["audio_buffer"], session_id)
                session["audio_buffer"] = b""  # Clear buffer
                return result
            
        except Exception as e:
            logger.error(f"Error processing audio chunk for session {session_id}: {e}")
        
        return None
    
    async def _transcribe_audio(self, audio_data: bytes, session_id: str) -> Dict[str, Any]:
        """Transcribe audio using Python SpeechRecognition with Google Speech-to-Text"""
        try:
            # Convert bytes to audio format for speech recognition
            audio_file = io.BytesIO(audio_data)
            
            # Use speech recognition with Google Speech-to-Text (free tier)
            try:
                with sr.AudioFile(audio_file) as source:
                    audio = self.speech_recognizer.record(source)
                
                # Use Google Speech Recognition (free service)
                text = self.speech_recognizer.recognize_google(audio)
                confidence = 0.8  # Default confidence for Google Speech Recognition
                
            except sr.UnknownValueError:
                text = ""
                confidence = 0.0
                logger.warning(f"Could not understand audio for session {session_id}")
            except sr.RequestError as e:
                text = ""
                confidence = 0.0
                logger.error(f"Google Speech Recognition error for session {session_id}: {e}")
            
            if text:
                # Perform speaker identification
                speaker = await self._identify_speaker(audio_data, text, session_id)
                
                # Extract medical terms
                medical_terms = await self._extract_medical_terms(text)
                
                # Use Gemini to enhance transcription accuracy for medical context
                enhanced_text = await self._enhance_medical_transcription(text)
                
                result = {
                    "text": enhanced_text or text,
                    "speaker": speaker,
                    "confidence": confidence,
                    "timestamp": datetime.utcnow().isoformat(),
                    "medical_terms": medical_terms
                }
                
                # Store in session history
                self.active_sessions[session_id]["transcription_history"].append(result)
                
                return result
            
        except Exception as e:
            logger.error(f"Error transcribing audio for session {session_id}: {e}")
        
        return {"text": "", "speaker": "unknown", "confidence": 0.0, "timestamp": datetime.utcnow().isoformat()}
    
    async def _identify_speaker(self, audio_data: bytes, text: str, session_id: str) -> str:
        """Identify speaker (doctor vs patient) using audio features and context"""
        try:
            # Simple rule-based speaker identification
            # In a production system, this would use more sophisticated ML models
            
            # Load audio for feature extraction
            audio_array = np.frombuffer(audio_data, dtype=np.int16)
            audio_float = audio_array.astype(np.float32) / 32768.0
            
            # Extract audio features
            mfccs = librosa.feature.mfcc(y=audio_float, sr=settings.SAMPLE_RATE, n_mfcc=13)
            pitch = librosa.piptrack(y=audio_float, sr=settings.SAMPLE_RATE)
            
            # Simple heuristics for speaker identification
            # Doctor typically speaks with more medical terminology
            medical_keywords = ["diagnosis", "prescription", "medication", "treatment", "symptoms", "examination"]
            patient_keywords = ["feel", "hurt", "pain", "sick", "tired", "worried"]
            
            text_lower = text.lower()
            doctor_score = sum(1 for keyword in medical_keywords if keyword in text_lower)
            patient_score = sum(1 for keyword in patient_keywords if keyword in text_lower)
            
            if doctor_score > patient_score:
                return "doctor"
            elif patient_score > doctor_score:
                return "patient"
            else:
                return "unknown"
                
        except Exception as e:
            logger.error(f"Error identifying speaker: {e}")
            return "unknown"
    
    async def _enhance_medical_transcription(self, text: str) -> Optional[str]:
        """Use Gemini to enhance transcription accuracy for medical context"""
        try:
            if not self.gemini_model or not text.strip():
                return None
                
            prompt = f"""
            Please correct and enhance this medical transcription for accuracy while preserving the original meaning. 
            Focus on proper medical terminology, spelling, and context. Only make necessary corrections:
            
            Original transcription: "{text}"
            
            Provide only the corrected text without explanations.
            """
            
            response = await asyncio.to_thread(
                self.gemini_model.generate_content,
                prompt
            )
            
            enhanced_text = response.text.strip()
            return enhanced_text if enhanced_text != text else None
            
        except Exception as e:
            logger.error(f"Error enhancing medical transcription: {e}")
            return None
    
    async def _extract_medical_terms(self, text: str) -> List[Dict[str, Any]]:
        """Extract medical terms and concepts from transcribed text using Gemini"""
        try:
            if not self.gemini_model or not text.strip():
                return []
                
            prompt = f"""
            Extract medical terms from this transcription and categorize them. Return only valid JSON format:
            
            Text: "{text}"
            
            Please identify and categorize medical terms into:
            - symptoms
            - medications  
            - conditions/diagnoses
            - procedures
            - body_parts
            
            Return as JSON array with format:
            [
                {
                    "term": "medical term",
                    "category": "symptom|medication|condition|procedure|body_part",
                    "confidence": 0.8,
                    "context": "surrounding context"
                }
            ]
            
            Return empty array [] if no medical terms found.
            """
            
            response = await asyncio.to_thread(
                self.gemini_model.generate_content,
                prompt
            )
            
            try:
                medical_terms = json.loads(response.text)
                return medical_terms if isinstance(medical_terms, list) else []
            except json.JSONDecodeError:
                # Fallback to simple keyword extraction
                return self._simple_medical_term_extraction(text)
            
        except Exception as e:
            logger.error(f"Error extracting medical terms: {e}")
            return self._simple_medical_term_extraction(text)
    
    def _simple_medical_term_extraction(self, text: str) -> List[Dict[str, Any]]:
        """Fallback simple keyword-based medical term extraction"""
        medical_terms = []
        
        # Common medical terminology patterns
        symptoms = ["pain", "fever", "nausea", "headache", "fatigue", "cough", "shortness of breath", "dizziness", "chest pain"]
        medications = ["aspirin", "ibuprofen", "acetaminophen", "antibiotic", "insulin", "metformin", "lisinopril"]
        conditions = ["hypertension", "diabetes", "asthma", "pneumonia", "infection", "flu", "cold"]
        
        text_lower = text.lower()
        
        for term in symptoms:
            if term in text_lower:
                medical_terms.append({
                    "term": term,
                    "category": "symptom",
                    "confidence": 0.7,
                    "context": text
                })
        
        for term in medications:
            if term in text_lower:
                medical_terms.append({
                    "term": term,
                    "category": "medication",
                    "confidence": 0.8,
                    "context": text
                })
        
        for term in conditions:
            if term in text_lower:
                medical_terms.append({
                    "term": term,
                    "category": "condition",
                    "confidence": 0.75,
                    "context": text
                })
        
        return medical_terms
    
    async def generate_soap_note(self, session_id: str, patient_info: Dict[str, Any]) -> Dict[str, Any]:
        """Generate SOAP note from transcription history"""
        try:
            if session_id not in self.active_sessions:
                return {"error": "Session not found"}
            
            session = self.active_sessions[session_id]
            transcription_history = session["transcription_history"]
            
            if not transcription_history:
                return {"error": "No transcription data available"}
            
            # Combine all transcriptions
            full_transcript = "\n".join([
                f"{item['speaker']}: {item['text']}" 
                for item in transcription_history
            ])
            
            # Use Gemini to generate SOAP note
            if self.gemini_model:
                prompt = f"""
                Based on the following doctor-patient conversation transcript, generate a structured SOAP note:

                Patient Information:
                - Name: {patient_info.get('name', 'N/A')}
                - Age: {patient_info.get('age', 'N/A')}
                - Gender: {patient_info.get('gender', 'N/A')}

                Transcript:
                {full_transcript}

                Please provide a structured SOAP note with the following sections:
                1. Subjective: Patient's reported symptoms and concerns
                2. Objective: Observable findings and measurements
                3. Assessment: Clinical impression and diagnosis
                4. Plan: Treatment plan and follow-up actions

                Also include:
                - Chief Complaint
                - History of Present Illness
                - Medications mentioned
                - Allergies mentioned
                - Vital signs if mentioned

                Format the response as a JSON object with these fields.
                """
                
                response = await asyncio.to_thread(
                    self.gemini_model.generate_content,
                    prompt
                )
                
                # Parse the response
                try:
                    soap_note = json.loads(response.text)
                except json.JSONDecodeError:
                    # If not JSON, create structured response
                    soap_note = {
                        "subjective": self._extract_subjective(full_transcript),
                        "objective": self._extract_objective(full_transcript),
                        "assessment": self._extract_assessment(full_transcript),
                        "plan": self._extract_plan(full_transcript),
                        "chief_complaint": self._extract_chief_complaint(full_transcript),
                        "confidence_score": 0.8
                    }
                
                return soap_note
            
        except Exception as e:
            logger.error(f"Error generating SOAP note: {e}")
            return {"error": f"Failed to generate SOAP note: {str(e)}"}
    
    def _extract_subjective(self, transcript: str) -> str:
        """Extract subjective information from transcript"""
        # Simple extraction - look for patient statements
        lines = transcript.split("\n")
        subjective_lines = [line for line in lines if line.startswith("patient:")]
        return "\n".join(subjective_lines)
    
    def _extract_objective(self, transcript: str) -> str:
        """Extract objective information from transcript"""
        # Look for doctor observations and measurements
        lines = transcript.split("\n")
        objective_lines = [line for line in lines if line.startswith("doctor:") and any(
            word in line.lower() for word in ["temperature", "blood pressure", "heart rate", "examination", "observed"]
        )]
        return "\n".join(objective_lines)
    
    def _extract_assessment(self, transcript: str) -> str:
        """Extract assessment information from transcript"""
        lines = transcript.split("\n")
        assessment_lines = [line for line in lines if line.startswith("doctor:") and any(
            word in line.lower() for word in ["diagnosis", "condition", "appears", "likely", "suggests"]
        )]
        return "\n".join(assessment_lines)
    
    def _extract_plan(self, transcript: str) -> str:
        """Extract plan information from transcript"""
        lines = transcript.split("\n")
        plan_lines = [line for line in lines if line.startswith("doctor:") and any(
            word in line.lower() for word in ["prescribe", "recommend", "follow up", "treatment", "plan", "schedule"]
        )]
        return "\n".join(plan_lines)
    
    def _extract_chief_complaint(self, transcript: str) -> str:
        """Extract chief complaint from transcript"""
        lines = transcript.split("\n")
        for line in lines:
            if line.startswith("patient:"):
                return line  # Usually the first patient statement
        return ""