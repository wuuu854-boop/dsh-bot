@echo off
setlocal
set "SCRIPT=%~dp0scripts\contain_foreign_browser.ps1"
if not exist "%SCRIPT%" (
  echo Missing script: %SCRIPT%
  pause
  exit /b 1
)
echo DSH Bot: installing the isolated Firefox firewall containment.
echo This only affects the dedicated Firefox copy under %~dp0browser.
echo A UAC prompt may appear; the elevation behavior depends on Windows policy.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath powershell -Verb RunAs -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-NoExit','-File','\"%SCRIPT%\"','-Action','Install')"
echo If the elevated window reports an error, nothing was installed.
pause
endlocal
