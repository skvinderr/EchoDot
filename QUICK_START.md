# 🚀 AI Medical Scribe - Quick Start

## 🏃‍♂️ Running the Application

### Method 1: Automatic Startup (Windows)
```bash
# Double-click or run from command line
start.bat
```

### Method 2: Manual Startup
```bash
# Terminal 1 - Backend
cd backend
python main.py

# Terminal 2 - Frontend  
cd frontend
set PORT=3001
npm start
```

## 🌐 Access Points

- **Frontend Application**: http://localhost:3001
- **Backend API Docs**: http://localhost:8000/docs  
- **WebSocket Endpoint**: ws://localhost:8000/ws

## 🔧 Environment Setup

Make sure you have configured:
- ✅ Gemini API key in `backend/.env`
- ✅ MongoDB connection string
- ✅ All dependencies installed

## 🛠️ Troubleshooting

**Port 3001 already in use?**
```bash
# Change port in frontend/.env
REACT_APP_PORT=3002
```

**MongoDB connection issues?**
```bash
# Check MongoDB is running
mongod --dbpath /path/to/your/db
```

**Gemini API quota exceeded?**  
- Check your usage at: https://aistudio.google.com/
- API quotas reset daily

## 📱 First Time Setup

1. **Register Account** - Create healthcare professional profile
2. **Add Patients** - Input patient information  
3. **Start Session** - Begin ambient transcription
4. **Review Notes** - Edit AI-generated SOAP notes

---

**Ready to reduce documentation time by 80%? Let's go! 🩺✨**