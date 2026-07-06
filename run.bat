@echo off
set PATH=C:\Program Files\nodejs;%PATH%
title Smart Navigation (VeloRoute) Launcher
color 0B

echo =======================================================================
echo               Smart Navigation (VeloRoute)
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

echo [1/2] Starting Python FastAPI Backend on Port 8001...
:: Launch backend in a separate terminal, install requirements, and run server with reload
start "VeloRoute Backend (Port 8001)" cmd /k "cd backend && python -m pip install -r requirements.txt && python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload"

echo [2/2] Starting React Frontend (Vite) on Port 3000...
:: Launch frontend in a separate terminal, install node packages, and run dev server
start "VeloRoute Frontend (Port 3000)" cmd /k "cd frontend && npm.cmd install && npm.cmd run dev"

echo.
echo =======================================================================
echo  Servers are successfully running in the background!
echo  Vite will automatically open the browser once initialized.
echo  To stop the application, simply close the spawned terminal windows.
echo =======================================================================
echo.
pause
