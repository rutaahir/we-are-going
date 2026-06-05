@echo off
cd /d "%~dp0backend"
echo Starting Django Backend Server...
echo.
venv\Scripts\python.exe manage.py runserver 8000
pause
