@echo off
chcp 65001 >nul
title Perxona AI Avatar Studio Launcher
echo ========================================================
echo   Perxona 3D AI Avatar 工作台啟動中...
echo ========================================================
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
