@echo off
echo ========================================================
echo Starting RESQ-NET Disaster Emergency Backend Engine
echo API running locally at: http://127.0.0.1:8000
echo For phone gateway access, use the laptop Wi-Fi IPv4 address on port 8000
echo Swagger Docs: http://127.0.0.1:8000/docs
echo ========================================================
set PYTHONPATH=%~dp0..
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
