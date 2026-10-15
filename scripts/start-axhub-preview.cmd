@echo off
setlocal

cd /d C:\axhub\ioc
if not exist "scripts\start-ioc-autostart.ps1" exit /b 1
start "Axhub IOC Make" /b powershell.exe -NoProfile -ExecutionPolicy Bypass -File "scripts\start-ioc-autostart.ps1"
endlocal
