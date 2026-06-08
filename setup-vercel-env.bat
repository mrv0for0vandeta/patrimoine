@echo off
echo ============================================
echo Vercel Environment Variables Setup Script
echo ============================================
echo.
echo This script will automatically configure all
echo required environment variables in Vercel.
echo.
echo Make sure you have Vercel CLI installed:
echo   npm install -g vercel
echo.
pause

echo.
echo [1/7] Setting DATABASE_URL...
vercel env add DATABASE_URL production < nul
echo postgresql://postgres.elswjgrymyiklvsjimav:Medmahdi2025+@aws-0-us-east-1.pooler.supabase.com:6543/postgres

echo.
echo [2/7] Setting NODE_ENV...
vercel env add NODE_ENV production < nul
echo production

echo.
echo [3/7] Setting JWT_SECRET...
vercel env add JWT_SECRET production < nul
echo moroccan_heritage_jwt_secret_2024_secure_minimum_32_chars

echo.
echo [4/7] Setting SESSION_SECRET...
vercel env add SESSION_SECRET production < nul
echo moroccan_session_secret_2024_secure_minimum_32_chars

echo.
echo [5/7] Setting ADMIN_USERNAME...
vercel env add ADMIN_USERNAME production < nul
echo admin

echo.
echo [6/7] Setting ADMIN_PASSWORD...
vercel env add ADMIN_PASSWORD production < nul
echo Patrimoine2024!

echo.
echo [7/7] Setting ADMIN_EMAIL...
vercel env add ADMIN_EMAIL production < nul
echo admin@patrimoine.gov.ma

echo.
echo ============================================
echo Done! Now redeploy your site:
echo   vercel --prod
echo ============================================
pause
