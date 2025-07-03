@echo off
echo ========================================
echo          FTP Data Upload Script
echo ========================================
echo.
echo Uploading local data folder to FTP server...
echo.

cd /d "%~dp0server"

echo Running FTP data upload...
node ftp-upload-data.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Data upload completed successfully!
) else (
    echo.
    echo ❌ Data upload failed with error code %ERRORLEVEL%
)

echo.
echo Press any key to exit...
pause >nul
