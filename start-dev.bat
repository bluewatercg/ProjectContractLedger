@echo off
chcp 65001 > nul
echo Starting Contract Ledger System - Midway Version
echo ================================================

echo.
echo Checking dependencies...
if not exist "midway-backend\node_modules" (
    echo Installing backend dependencies...
    cd midway-backend
    call yarn install
    cd ..
)

if not exist "midway-frontend\node_modules" (
    echo Installing frontend dependencies...
    cd midway-frontend
    call yarn install
    cd ..
)

echo.
echo 1. Starting backend service...
cd midway-backend
start "Midway Backend - Port 8080" cmd /k "yarn dev"

echo.
echo 2. Waiting 5 seconds before starting frontend...
timeout /t 5 /nobreak > nul

cd ..\midway-frontend
start "Midway Frontend - Port 8000" cmd /k "yarn dev"

echo.
echo Services started successfully!
echo ================================================
echo Frontend URL: http://localhost:8000
echo Backend URL:  http://localhost:8080
echo API Docs:     http://localhost:8080/api-docs
echo.
echo Database Info:
echo Host: mysql.sqlpub.com:3306
echo Database: procontractledger
echo.
echo Default Login Account:
echo Username: admin
echo Password: admin123
echo.
pause
