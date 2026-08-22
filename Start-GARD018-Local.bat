@echo off
setlocal
cd /d "%~dp0"
title GARD018 Local Server
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-local.ps1"
set "EXIT_CODE=%ERRORLEVEL%"
echo.
if "%EXIT_CODE%"=="0" (
  echo GARD018 je pokrenut. Prozor ostaje otvoren da bi se video status servera.
) else (
  echo GARD018 se nije pokrenuo. Kod greske: %EXIT_CODE%
)
echo.
pause
exit /b %EXIT_CODE%
