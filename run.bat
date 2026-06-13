@echo off
title VeloRoute Vientiane Launcher
color 0B

echo =======================================================================
echo               VeloRoute Vientiane - Smart City Navigation
echo               [One-Click Service Startup Launcher]
echo =======================================================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH. Please install Node.js.
    pause
    exit /b
)

:: Check for Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python.
    pause
    exit /b
)

echo [1/3] Launching FastAPI Backend Server on Port 8001...
start "VeloRoute Backend (8001)" cmd /c "cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8001"

echo [2/3] Launching React Frontend (Vite) Dev Server...
start "VeloRoute Frontend (Vite)" cmd /c "cd frontend && npm run dev"

echo [3/3] Waiting for servers to initialize (5 seconds)...
timeout /t 5 /nobreak > nul

echo.
echo =======================================================================
echo   Opening Web Navigation Dashboards in your default browser...
echo =======================================================================
:: Open both ports 3000 and 3001 in case port 3000 is occupied.
start http://localhost:3000
start http://localhost:3001

echo.
echo Startup completed successfully! 
echo Please keep the spawned command prompt windows open while using the application.
echo.
pause
