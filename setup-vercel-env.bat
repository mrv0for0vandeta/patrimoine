@echo off
echo ========================================
echo   Setting up Vercel Environment Variables
echo ========================================
echo.

echo IMPORTANT: You need to enter your Supabase database password!
echo Get it from: https://supabase.com/dashboard/project/elswjgrymyiklvsjimav/settings/database
echo.
set /p DB_PASSWORD="Enter your Supabase database password: "

echo.
echo Adding environment variables to Vercel...
echo.

vercel env add DATABASE_URL production "postgresql://postgres:%DB_PASSWORD%@db.elswjgrymyiklvsjimav.supabase.co:5432/postgres"
vercel env add NODE_ENV production "production"
vercel env add JWT_SECRET production "moroccan_heritage_jwt_secret_2024_secure_minimum_32_chars"
vercel env add SESSION_SECRET production "moroccan_session_secret_2024_secure_minimum_32_chars"
vercel env add ADMIN_USERNAME production "admin"
vercel env add ADMIN_PASSWORD production "Patrimoine2024!"
vercel env add ADMIN_EMAIL production "admin@patrimoine.gov.ma"

echo.
echo ========================================
echo   Environment Variables Added!
echo ========================================
echo.
echo Now redeploying your app...
vercel --prod

echo.
echo ========================================
echo   DONE!
echo ========================================
echo.
echo Your app should be live now!
echo Visit: https://patrimoine-jet.vercel.app
echo.
pause
