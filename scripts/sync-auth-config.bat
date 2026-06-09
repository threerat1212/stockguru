@echo off
REM Sync Supabase Auth Configuration to Production
REM This script updates site_url and redirect URLs in Supabase Auth settings

echo 🔄 Syncing Supabase Auth Configuration...

REM Navigate to project root
cd /d "%~dp0.."

REM Push auth config to remote
supabase config push --yes

echo ✅ Auth configuration synced successfully!
echo.
echo Current settings:
echo   Site URL: https://stockguru-web.onrender.com
echo   Redirect URLs: https://stockguru-web.onrender.com, http://127.0.0.1:3000
