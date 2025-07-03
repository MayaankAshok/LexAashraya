@echo off
echo Creating backup of public/data folder...

REM Get current date and time for backup folder name using PowerShell
for /f "usebackq delims=" %%i in (`powershell -command "Get-Date -Format 'yyyyMMdd_HHmm'"`) do set datetime=%%i

REM Create backup folder name with timestamp
set backup_name=data_backup_%datetime%

echo Creating backup: %backup_name%

REM Create backups directory if it doesn't exist
if not exist "backups" mkdir backups

REM Copy the data folder to backup location
xcopy "public\data" "backups\%backup_name%" /E /I /H /Y

if %errorlevel% equ 0 (
    echo.
    echo ✓ Backup completed successfully!
    echo Backup location: backups\%backup_name%
    echo.
    echo Files backed up:
    dir "backups\%backup_name%" /S /B | find /C /V ""
    echo files total
) else (
    echo.
    echo ✗ Backup failed with error code %errorlevel%
)

echo.
pause
