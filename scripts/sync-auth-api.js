#!/usr/bin/env node
/**
 * Sync Supabase Auth Configuration via Management API
 * This script updates site_url and redirect URLs using Supabase Management API
 */

const PROJECT_REF = 'sxmaiqnclgyspfsbmvoa';
const API_KEY = process.env.SUPABASE_MANAGEMENT_API_KEY;

if (!API_KEY) {
  console.error('❌ Error: SUPABASE_MANAGEMENT_API_KEY environment variable not set');
  console.error('   Set it in Render secrets or export it locally');
  process.exit(1);
}

const SITE_URL = 'https://stockguru-web.onrender.com';
const REDIRECT_URLS = 'https://stockguru-web.onrender.com,http://127.0.0.1:3000';

async function syncAuthConfig() {
  console.log('🔄 Syncing Supabase Auth Configuration via Management API...');

  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_url: SITE_URL,
          uri_allow_list: REDIRECT_URLS,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    console.log('✅ Auth configuration synced successfully!');
    console.log('');
    console.log('Current settings:');
    console.log(`  Site URL: ${data.site_url}`);
    console.log(`  Redirect URLs: ${data.uri_allow_list}`);
    console.log(`  Google Auth: ${data.external_google_enabled ? '✅ Enabled' : '❌ Disabled'}`);

  } catch (error) {
    console.error('❌ Error syncing auth config:', error.message);
    process.exit(1);
  }
}

syncAuthConfig();
