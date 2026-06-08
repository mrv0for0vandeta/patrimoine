@echo off
echo.
echo ========================================
echo   PUSH TO GITHUB - PATRIMOINE PROJECT
echo ========================================
echo.

REM Change to the project directory
cd /d "C:\Users\HP\Desktop\gjfi"

echo [1/3] Checking git status...
git status
echo.

echo [2/3] Enter your GitHub Personal Access Token (ghp_...):
set /p TOKEN="Token: "
echo.

echo [3/3] Pushing to GitHub...
git push https://%TOKEN%@github.com/edjhd146-gif/patrimoine.git main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ SUCCESS! Project pushed to GitHub!
    echo.
    echo View your repository at:
    echo https://github.com/edjhd146-gif/patrimoine
    echo.
) else (
    echo.
    echo ❌ FAILED! Check your token and try again.
    echo.
    echo Need help? Read GIT_PUSH_INSTRUCTIONS.md
    echo.
)

pause
