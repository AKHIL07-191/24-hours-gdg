@echo off
echo ========================================================
echo Starting RESQ-NET Tactical Operations Dashboard (Vite)
echo Dashboard running at: http://localhost:5173
echo ========================================================
set PATH=%~dp0..\.tools\nodejs;%PATH%
cd %~dp0..\frontend
node "%~dp0..\.tools\nodejs\node_modules\npm\bin\npm-cli.js" run dev
