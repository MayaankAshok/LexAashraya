@echo off
echo ========================================
echo    Build and Deploy Static Website
echo ========================================
echo.

echo Building static website...
npm run build:static
if %ERRORLEVEL% neq 0 (
    echo.
    echo Build failed with error code %ERRORLEVEL%
    echo Press any key to exit...
    pause >nul
    exit /b %ERRORLEVEL%
)

echo.
echo Build completed successfully!
echo.

echo Uploading to FTP server...
cd /d "%~dp0server"
node ftp-upload-build.js

if %ERRORLEVEL% equ 0 (
    echo.
    echo Build and deployment completed successfully!
) else (
    echo.
    echo Deployment failed with error code %ERRORLEVEL%
)

echo.
echo Press any key to exit...
pause >nul
