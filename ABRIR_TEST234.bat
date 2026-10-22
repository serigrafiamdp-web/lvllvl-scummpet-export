@echo off
setlocal
cd /d "%~dp0"
start "LVLLVL TEST234 - servidor local" powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0SERVIDOR_TEST234.ps1"
exit /b 0
