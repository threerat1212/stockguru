#!/bin/bash
# Sync Supabase Auth Configuration to Production
# This script updates site_url and redirect URLs in Supabase Auth settings

set -e

echo "🔄 Syncing Supabase Auth Configuration..."

# Navigate to project root
cd "$(dirname "$0")/.."

# Push auth config to remote
supabase config push --yes

echo "✅ Auth configuration synced successfully!"
echo ""
echo "Current settings:"
echo "  Site URL: https://stockguru-web.onrender.com"
echo "  Redirect URLs: https://stockguru-web.onrender.com, http://127.0.0.1:3000"
