@echo off
echo Uploading build files to FTP server...
cd /d "%~dp0server"
node ftp-upload-build.js
if %errorlevel% neq 0 (
    echo Error occurred during build upload
    pause
    exit /b %errorlevel%
)
echo Build upload completed successfully
pause
