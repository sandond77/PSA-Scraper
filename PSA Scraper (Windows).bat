@echo off
:: Double-click this file to launch the PSA Card Image Scraper.
:: Requires Node.js — download from https://nodejs.org if needed.

cd /d "%~dp0src"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js is not installed.
    echo Download it from https://nodejs.org then try again.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\patchright" (
    echo.
    echo First-time setup: installing dependencies...
    call npm install
    echo.
)

echo First-time setup: ensuring browser is ready...
call npx patchright install chromium
echo.

node run-psa-firstview.mjs

echo.
pause
