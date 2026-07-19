@echo off
echo ========================================
echo CertiVault Setup Script
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed. Please install Node.js 20+ first.
    echo Download from: https://nodejs.org/
    exit /b 1
)

echo [1/5] Checking Node.js version...
node --version
echo.

echo [2/5] Installing root dependencies...
call npm install
echo.

echo [3/5] Installing backend dependencies...
cd backend
call npm install
cd ..
echo.

echo [4/5] Installing frontend dependencies...
cd frontend
call npm install
cd ..
echo.

echo [5/5] Setting up environment files...
if not exist backend\.env (
    copy backend\.env.example backend\.env
    echo Created backend\.env from example
) else (
    echo backend\.env already exists
)

if not exist frontend\.env (
    copy frontend\.env.example frontend\.env 2>nul
    if errorlevel 1 (
        echo # Frontend environment
        echo VITE_API_URL=http://localhost:5000/api/v1
        echo.> frontend\.env
        echo Created frontend\.env
    ) else (
        echo frontend\.env already exists
    )
)

echo.
echo ========================================
echo Setup complete!
echo ========================================
echo.
echo Next steps:
echo 1. Configure your MongoDB connection in backend\.env
echo 2. Configure your JWT secrets in backend\.env
echo 3. Run 'npm start' to start both frontend and backend
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo.