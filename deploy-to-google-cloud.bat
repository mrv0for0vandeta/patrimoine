@echo off
echo ========================================
echo   Deploying to Google Cloud Run
echo ========================================
echo.

REM Set project
echo Setting project...
gcloud config set project project-b549689b-6c19-4fcd-803

echo.
echo Enabling APIs...
gcloud services enable cloudbuild.googleapis.com run.googleapis.com

echo.
echo Starting deployment...
echo This will take about 10 minutes...
echo.

gcloud run deploy patrimoine-survey ^
  --source . ^
  --platform managed ^
  --region europe-west1 ^
  --allow-unauthenticated ^
  --set-env-vars NODE_ENV=production,JWT_SECRET=moroccan_heritage_jwt_secret_2024,SESSION_SECRET=moroccan_session_secret_2024,ADMIN_USERNAME=admin,ADMIN_PASSWORD=Patrimoine2024!,ADMIN_EMAIL=admin@patrimoine.gov.ma

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Your app should now be live!
echo Check the URL above to visit it.
echo.
pause
