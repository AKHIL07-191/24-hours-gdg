@echo off
echo ========================================================
echo Running RESQ-NET Disaster Resilience & Chaos Simulator
echo Tests offline queue, reconnect sync, and duplicate suppression
echo ========================================================
set PYTHONPATH=%~dp0..
python gateway\simulator\network_chaos_simulator.py
pause
