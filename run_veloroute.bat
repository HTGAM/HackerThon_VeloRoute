@echo off
set PATH=C:\Program Files\nodejs;%PATH%
title VeloRoute Vientiane Launcher
echo =====================================================================
echo  VeloRoute Vientiane - Flood-Resilient Traffic Routing Launcher
echo =====================================================================
echo.

echo [1/3] Starting Python FastAPI Backend on Port 8001...
:: Launch backend in a separate Command Prompt window, install dependencies, and run server
start "VeloRoute Backend (Port 8001)" cmd /k "cd backend && python -m pip install -r requirements.txt && python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload"

echo [2/3] Starting React Frontend (Vite)...
:: Launch frontend in a separate Command Prompt window, install node modules, and run vite
start "VeloRoute Frontend (Port 3000)" cmd /k "cd frontend && npm.cmd install && npm.cmd run dev"

echo [3/3] Waiting for servers to initialize...
:: 6 seconds delay to give servers time to bind ports
timeout /t 6 >nul

echo [OK] Launching default web browser...
start http://localhost:3000

echo.
echo =====================================================================
echo  Servers are successfully running in the background!
echo  If you want to stop the servers, just close the popped-up terminals.
echo =====================================================================
pause

