@echo off
cd /d "%~dp0"
start "Alifbo" cmd /c "py -3 -m http.server 8765"
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:8765/lessons/lesson1.html"
