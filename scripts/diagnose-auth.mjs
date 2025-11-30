/**
 * SharePoint Authentication Diagnostic Script
 * Run with: node scripts/diagnose-auth.mjs
 */

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '..', '.env.local') });
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const TENANT_ID = process.env.AZURE_TENANT_ID || process.env.TENANT_ID;
const CLIENT_ID = process.env.AZURE_CLIENT_ID || process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET || process.env.CLIENT_SECRET;
const SITE_URL = process.env.SHAREPOINT_SITE_URL;

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     SharePoint Authentication Diagnostic                    ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');
console.log('Configuration Status:');
console.log('─────────────────────');
console.log('SHAREPOINT_SITE_URL:', SITE_URL || 'NOT SET ❌');
console.log('TENANT_ID:', TENANT_ID ? TENANT_ID.substring(0,8) + '...' : 'NOT SET ❌');
console.log('CLIENT_ID:', CLIENT_ID ? CLIENT_ID.substring(0,8) + '...' : 'NOT SET ❌');

const isPlaceholder = CLIENT_SECRET && (CLIENT_SECRET.includes('your-') || CLIENT_SECRET.includes('placeholder'));
if (isPlaceholder) {
  console.log('CLIENT_SECRET: ⚠️  PLACEHOLDER VALUE DETECTED!');
} else if (CLIENT_SECRET) {
  console.log('CLIENT_SECRET: [' + CLIENT_SECRET.length + ' chars]');
} else {
  console.log('CLIENT_SECRET: NOT SET ❌');
}
console.log('');

// Check for issues
const issues = [];
if (!SITE_URL) issues.push('SHAREPOINT_SITE_URL is not set');
if (!TENANT_ID) issues.push('TENANT_ID / AZURE_TENANT_ID is not set');
if (!CLIENT_ID) issues.push('CLIENT_ID / AZURE_CLIENT_ID is not set');
if (!CLIENT_SECRET) issues.push('CLIENT_SECRET / AZURE_CLIENT_SECRET is not set');
if (isPlaceholder) issues.push('CLIENT_SECRET contains placeholder value - replace with real secret');

if (issues.length > 0) {
  console.log('❌ Configuration Issues Found:');
  issues.forEach(issue => console.log('   • ' + issue));
  console.log('');
  console.log('To fix: Update your .env.local file with real Azure AD credentials');
  console.log('Or set environment variables: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET');
  process.exit(1);
}

console.log('✅ All configuration values present');
console.log('');
console.log('Testing Azure AD Authentication...');
console.log('─────────────────────────────────');

async function testAuth() {
  const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await response.json();

    if (data.access_token) {
      console.log('✅ Azure AD Authentication: SUCCESS');
      console.log('   Token type:', data.token_type);
      console.log('   Expires in:', data.expires_in, 'seconds');
      console.log('');
      return data.access_token;
    } else {
      console.log('❌ Azure AD Authentication: FAILED');
      console.log('   Error:', data.error);
      console.log('   Description:', data.error_description);
      console.log('');

      if (data.error === 'invalid_client') {
        console.log('Possible causes:');
        console.log('   • Client secret has expired');
        console.log('   • Client secret is incorrect');
        console.log('   • App registration has been deleted');
      } else if (data.error === 'unauthorized_client') {
        console.log('Possible causes:');
        console.log('   • App is not configured for client credentials flow');
        console.log('   • Tenant ID is incorrect');
      }
      return null;
    }
  } catch (err) {
    console.log('❌ Network error:', err.message);
    return null;
  }
}

async function testSharePointAccess(token) {
  console.log('Testing SharePoint Access...');
  console.log('───────────────────────────');

  const url = new URL(SITE_URL);
  const hostname = url.hostname;
  const sitePath = url.pathname;

  // Test 1: Get site info via Graph API
  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${hostname}:${sitePath}`;

  try {
    const response = await fetch(graphUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ SharePoint Site Access: SUCCESS');
      console.log('   Site Name:', data.displayName || data.name);
      console.log('   Site ID:', data.id);
      console.log('   Web URL:', data.webUrl);
      return data.id;
    } else {
      console.log('❌ SharePoint Site Access: FAILED');
      console.log('   Status:', response.status);
      console.log('   Error:', data.error?.message || JSON.stringify(data));

      if (response.status === 403) {
        console.log('');
        console.log('Permission Issue - The app needs these permissions:');
        console.log('   • Sites.Read.All (Application)');
        console.log('   • Sites.FullControl.All (Application) - for write access');
        console.log('');
        console.log('Go to Azure Portal → App Registrations → API Permissions');
        console.log('Add permissions and grant admin consent');
      }
      return null;
    }
  } catch (err) {
    console.log('❌ Network error:', err.message);
    return null;
  }
}

async function testListAccess(token, siteId) {
  console.log('');
  console.log('Testing SharePoint Lists...');
  console.log('───────────────────────────');

  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists`;

  try {
    const response = await fetch(graphUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Lists Access: SUCCESS');
      console.log('   Total lists found:', data.value?.length || 0);

      // Check for expected SGA lists
      const expectedLists = ['Jobs', 'Projects', 'Incidents', 'Resources', 'QAPacks'];
      const foundLists = data.value?.map(l => l.displayName) || [];

      console.log('');
      console.log('   Expected SGA Lists:');
      expectedLists.forEach(name => {
        const found = foundLists.includes(name);
        console.log(`   ${found ? '✅' : '❌'} ${name}`);
      });
    } else {
      console.log('❌ Lists Access: FAILED');
      console.log('   Error:', data.error?.message || JSON.stringify(data));
    }
  } catch (err) {
    console.log('❌ Network error:', err.message);
  }
}

// Run diagnostics
async function main() {
  const token = await testAuth();

  if (token) {
    console.log('');
    const siteId = await testSharePointAccess(token);

    if (siteId) {
      await testListAccess(token, siteId);
    }
  }

  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('Diagnostic complete.');
}

main().catch(console.error);
