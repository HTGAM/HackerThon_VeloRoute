@echo off
set PATH=C:\Program Files\nodejs;%PATH%
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

echo [1/3] Starting Python FastAPI Backend on Port 8001...
:: Launch backend in a separate terminal, install requirements, and run server with reload
start "VeloRoute Backend (Port 8001)" cmd /k "cd backend && python -m pip install -r requirements.txt && python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload"

echo [2/3] Starting React Frontend (Vite) on Port 3000...
:: Launch frontend in a separate terminal, install node packages, and run dev server
start "VeloRoute Frontend (Port 3000)" cmd /k "cd frontend && npm.cmd install && npm.cmd run dev"

echo [3/3] Waiting for servers to initialize (6 seconds)...
timeout /t 6 >nul

echo [OK] Launching default web browser at http://localhost:3000 ...
start http://localhost:3000

echo.
echo =======================================================================
echo  Servers are successfully running in the background!
echo  To stop the application, simply close the spawned terminal windows.
echo =======================================================================
echo.
pause
