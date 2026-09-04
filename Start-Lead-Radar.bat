@echo off
title Aetheria Lead Radar - 24/7 Internet Intelligence
color 0E
cls
echo =====================================================================
echo           AETHERIA LEAD RADAR - 24/7 INTERNET INTELLIGENCE
echo =====================================================================
echo  [+] Target Sources : Reddit, Google Alerts RSS, Forums, Telegram
echo  [+] Discord Pings  : Real-Time Lead Alerts & 1-Tap Copy Pitches
echo  [+] Background Loop: Scanning every 60 seconds
echo.
echo  Press Ctrl+C anytime to pause/stop the radar.
echo =====================================================================
echo.

cd /d "%~dp0"
npm run radar
pause
