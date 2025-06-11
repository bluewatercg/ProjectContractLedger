@echo off
echo Starting Midway Contract Ledger System...
echo.

REM Install dependencies if needed
if not exist "midway-backend\node_modules" (
    echo Installing backend dependencies...
    cd midway-backend
    yarn install
    cd ..
)

if not exist "midway-frontend\node_modules" (
    echo Installing frontend dependencies...
    cd midway-frontend
    yarn install
    cd ..
)

REM Start backend service
echo Starting backend service on port 8080...
cd midway-backend
start "Backend" cmd /k "yarn dev"
cd ..

REM Wait a moment
timeout /t 3 /nobreak > nul

REM Start frontend service
echo Starting frontend service on port 8000...
cd midway-frontend
start "Frontend" cmd /k "yarn dev"
cd ..

echo.
echo Services are starting...
echo Frontend: http://localhost:8000
echo Backend:  http://localhost:8080
echo Login:    admin / admin123
echo.
pause
