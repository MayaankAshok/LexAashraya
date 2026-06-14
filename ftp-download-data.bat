@echo off
chcp 65001 >nul
echo ========================================
echo        FTP Data Download Script
echo ========================================
echo.
echo Downloading remote data folder from FTP server...
echo.

pushd "%~dp0server"
node ftp-download-data.js
set EXIT_CODE=%ERRORLEVEL%
popd

if %EXIT_CODE% EQU 0 (
    echo.
    echo Data download completed successfully!
) else (
    echo.
    echo Data download failed with error code %EXIT_CODE%
)

echo.
echo Press any key to exit...
pause >nul
