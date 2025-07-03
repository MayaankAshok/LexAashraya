@echo off
echo ========================================
echo        FTP Data Download Script
echo ========================================
echo.
echo Downloading remote data folder from FTP server...
echo.

cd /d "%~dp0server"

echo Running FTP data download...
node ftp-download-data.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Data download completed successfully!
) else (
    echo.
    echo ❌ Data download failed with error code %ERRORLEVEL%
)

echo.
echo Press any key to exit...
pause >nul
