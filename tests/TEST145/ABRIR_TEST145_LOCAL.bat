@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  start "TEST145 WEB" "http://127.0.0.1:8765/index.html?v=test145"
  py -3 -m http.server 8765 --bind 127.0.0.1
  goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "TEST145 WEB" "http://127.0.0.1:8765/index.html?v=test145"
  python -m http.server 8765 --bind 127.0.0.1
  goto :eof
)
echo Se necesita Python 3 para abrirlo en un servidor local.
echo Alternativa: usar la version online de TEST145.
pause
