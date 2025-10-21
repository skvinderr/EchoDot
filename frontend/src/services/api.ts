import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/login', credentials),
  
  register: (userData: any) =>
    api.post('/register', userData),
  
  getProfile: () =>
    api.get('/me'),
  
  updateProfile: (data: any) =>
    api.put('/me', data),
};

// Transcription API
export const transcriptionAPI = {
  createSession: (patientId: string) =>
    api.post('/sessions', { patient_id: patientId }),
  
  getSessions: () =>
    api.get('/sessions'),
  
  getSession: (sessionId: string) =>
    api.get(`/sessions/${sessionId}`),
  
  endSession: (sessionId: string) =>
    api.put(`/sessions/${sessionId}/end`),
  
  uploadAudio: (sessionId: string, audioFile: File) => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    return api.post(`/sessions/${sessionId}/upload-audio`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  getTranscript: (sessionId: string) =>
    api.get(`/sessions/${sessionId}/transcript`),
  
  analyzeTranscription: (sessionId: string) =>
    api.post(`/sessions/${sessionId}/analyze`),
};

// SOAP Notes API
export const notesAPI = {
  generateSOAPNote: (sessionId: string, patientInfo: any) =>
    api.post(`/notes/generate/${sessionId}`, patientInfo),
  
  getSOAPNotes: (filters?: { patient_id?: string; status?: string }) =>
    api.get('/notes', { params: filters }),
  
  getSOAPNote: (noteId: string) =>
    api.get(`/notes/${noteId}`),
  
  updateSOAPNote: (noteId: string, data: any) =>
    api.put(`/notes/${noteId}`, data),
  
  approveSOAPNote: (noteId: string) =>
    api.post(`/notes/${noteId}/approve`),
  
  deleteSOAPNote: (noteId: string) =>
    api.delete(`/notes/${noteId}`),
};

// Patients API
export const patientsAPI = {
  createPatient: (patientData: any) =>
    api.post('/patients', patientData),
  
  getPatients: (search?: string, limit?: number) =>
    api.get('/patients', { params: { search, limit } }),
  
  getPatient: (patientId: string) =>
    api.get(`/patients/${patientId}`),
  
  updatePatient: (patientId: string, data: any) =>
    api.put(`/patients/${patientId}`, data),
  
  getPatientNotes: (patientId: string) =>
    api.get(`/patients/${patientId}/notes`),
  
  getPatientSessions: (patientId: string) =>
    api.get(`/patients/${patientId}/sessions`),
};

export default api;