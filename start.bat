@echo off
title AI Medical Scribe - Startup

echo.
echo ===================================
echo   🏥 AI Medical Scribe Startup
echo ===================================
echo.

echo Starting Backend Server...
start "Backend" cmd /k "cd backend && python main.py"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start "Frontend" cmd /k "cd frontend && set PORT=3001 && npm start"

echo.
echo ✅ Both servers are starting up!
echo.
echo 📊 Backend API: http://localhost:8000/docs
echo 🖥️  Frontend:   http://localhost:3001
echo.
echo Press any key to exit this window...
pause >nul