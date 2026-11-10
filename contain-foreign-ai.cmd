@echo off
setlocal
set "SCRIPT=%~dp0scripts\contain_foreign_ai.ps1"
if not exist "%SCRIPT%" (
  echo Missing script: %SCRIPT%
  pause
  exit /b 1
)
echo DSH Bot: installing the foreign-AI firewall containment.
echo A UAC prompt will appear. Choose "Yes" to allow the one-time setup.
echo The script self-tests with a throw-away curl.exe before touching any app.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath powershell -Verb RunAs -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-NoExit','-File','\"%SCRIPT%\"','-Action','Install')"
echo If the elevated window reports an error, nothing was installed.
pause
endlocal
