@echo off
echo Starting JustSpeak Development Server...
echo.
echo This window must remain open while testing.
echo Press Ctrl+C to stop the server.
echo.

cd /d "%~dp0"
npm run dev

pause