@echo off
echo ============================================
echo Cloudflare Pages Deployment Script
echo ============================================
echo.

REM Check if wrangler is installed
where wrangler >nul 2>&1
if %errorlevel% neq 0 (
    echo [1/4] Installing Wrangler CLI...
    call npm install -g wrangler
    if %errorlevel% neq 0 (
        echo.
        echo Error: Failed to install Wrangler CLI
        echo Please run: npm install -g wrangler
        pause
        exit /b 1
    )
) else (
    echo [1/4] Wrangler CLI is already installed
)

echo.
echo [2/4] Logging in to Cloudflare...
echo (This will open your browser)
call wrangler login
if %errorlevel% neq 0 (
    echo.
    echo Error: Failed to login to Cloudflare
    pause
    exit /b 1
)

echo.
echo [3/4] Deploying to Cloudflare Pages...
call wrangler pages deploy frontend --project-name=moroccan-heritage-survey
if %errorlevel% neq 0 (
    echo.
    echo Error: Deployment failed
    pause
    exit /b 1
)

echo.
echo ============================================
echo Deployment Complete!
echo ============================================
echo.
echo Your site is now live at:
echo https://moroccan-heritage-survey.pages.dev/
echo.
echo [4/4] IMPORTANT: Add Environment Variables
echo.
echo Go to: https://dash.cloudflare.com/
echo 1. Click "Workers & Pages"
echo 2. Click your project
echo 3. Go to Settings → Environment variables
echo 4. Add these 7 variables:
echo    - DATABASE_URL
echo    - NODE_ENV
echo    - JWT_SECRET
echo    - SESSION_SECRET
echo    - ADMIN_USERNAME
echo    - ADMIN_PASSWORD
echo    - ADMIN_EMAIL
echo.
echo See CLOUDFLARE_DEPLOY.md for values
echo.
pause
