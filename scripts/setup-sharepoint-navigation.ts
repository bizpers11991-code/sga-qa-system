/**
 * Setup SharePoint Navigation with proper structure
 * Requires SharePoint Sites.Manage.All permission
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });

const config = {
  SITE_URL: process.env.SHAREPOINT_SITE_URL!,
  CLIENT_ID: process.env.AZURE_CLIENT_ID!,
  CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET!,
  TENANT_ID: process.env.AZURE_TENANT_ID!,
};

// Get SharePoint-specific token (not Graph API)
async function getSharePointToken(): Promise<string> {
  const url = new URL(config.SITE_URL);
  const resource = `${url.protocol}//${url.hostname}`;

  const tokenUrl = `https://login.microsoftonline.com/${config.TENANT_ID}/oauth2/v2.0/token`;
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.CLIENT_ID,
      client_secret: config.CLIENT_SECRET,
      scope: `${resource}/.default`,
      grant_type: 'client_credentials',
    }).toString(),
  });

  const data = await response.json();
  if (!data.access_token) {
    console.error('Token error:', data);
    throw new Error('Failed to get SharePoint token');
  }
  return data.access_token;
}

// Get Graph API token
async function getGraphToken(): Promise<string> {
  const tokenUrl = `https://login.microsoftonline.com/${config.TENANT_ID}/oauth2/v2.0/token`;
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.CLIENT_ID,
      client_secret: config.CLIENT_SECRET,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    }).toString(),
  });

  const data = await response.json();
  if (!data.access_token) {
    throw new Error('Failed to get Graph token');
  }
  return data.access_token;
}

// Get site ID for Graph API
async function getSiteId(token: string): Promise<string> {
  const url = new URL(config.SITE_URL);
  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${url.hostname}:${url.pathname}`;

  const response = await fetch(graphUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  return data.id;
}

// Test SharePoint REST API access
async function testSharePointAccess(token: string): Promise<boolean> {
  console.log('  Testing SharePoint REST API access...');

  const response = await fetch(`${config.SITE_URL}/_api/web`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json;odata=verbose',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    console.log(`  ✗ SharePoint REST API returned ${response.status}: ${text.substring(0, 200)}`);
    return false;
  }

  console.log('  ✓ SharePoint REST API accessible');
  return true;
}

// Use Graph API to manage navigation (alternative approach)
async function setupNavigationViaGraph(token: string, siteId: string): Promise<void> {
  const siteUrl = config.SITE_URL;

  console.log('\n📋 Navigation structure to add:');
  console.log('─'.repeat(50));

  const navStructure = [
    { section: '📁 DOCUMENT LIBRARIES', items: [
      { title: 'Specifications', url: `${siteUrl}/Specifications` },
      { title: 'Test Methods', url: `${siteUrl}/TestMethods` },
      { title: 'QA Documents', url: `${siteUrl}/QADocuments` },
      { title: 'Site Photos', url: `${siteUrl}/SitePhotos` },
      { title: 'Incident Reports', url: `${siteUrl}/IncidentReports` },
      { title: 'NCR Documents', url: `${siteUrl}/NCRDocuments` },
      { title: 'Scope Report Docs', url: `${siteUrl}/ScopeReportDocs` },
    ]},
    { section: '📋 LISTS', items: [
      { title: 'Jobs', url: `${siteUrl}/Lists/Jobs` },
      { title: 'Projects', url: `${siteUrl}/Lists/Projects` },
      { title: 'Tenders', url: `${siteUrl}/Lists/Tenders` },
      { title: 'QA Packs', url: `${siteUrl}/Lists/QAPacks` },
      { title: 'Incidents', url: `${siteUrl}/Lists/Incidents` },
      { title: 'NCRs', url: `${siteUrl}/Lists/NCRs` },
      { title: 'Scope Reports', url: `${siteUrl}/Lists/ScopeReports` },
      { title: 'Foremen', url: `${siteUrl}/Lists/Foremen` },
      { title: 'Division Requests', url: `${siteUrl}/Lists/DivisionRequests` },
      { title: 'Resources', url: `${siteUrl}/Lists/Resources` },
    ]},
    { section: '⚙️ SYSTEM', items: [
      { title: 'ITP Templates', url: `${siteUrl}/Lists/ITPTemplates` },
      { title: 'Sampling Plans', url: `${siteUrl}/Lists/SamplingPlans` },
      { title: 'Drafts', url: `${siteUrl}/Lists/Drafts` },
      { title: 'Notifications', url: `${siteUrl}/Lists/Notifications` },
    ]},
  ];

  for (const section of navStructure) {
    console.log(`\n${section.section}`);
    for (const item of section.items) {
      console.log(`  • ${item.title}`);
      console.log(`    ${item.url}`);
    }
  }

  // Try to use Graph API beta endpoint for navigation
  console.log('\n\n🔧 Attempting to update navigation via Graph API...');

  // Graph API doesn't have direct navigation management
  // We need to use SharePoint REST API or CSOM for this
  // Let's try the _api/navigation endpoint with the token

  const navResponse = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (navResponse.ok) {
    const siteData = await navResponse.json();
    console.log('  Site name:', siteData.displayName);
    console.log('  Web URL:', siteData.webUrl);
  }

  // Unfortunately, Graph API doesn't support navigation modification directly
  // We need SharePoint REST API permissions which return 401
  console.log('\n⚠️  Graph API does not support direct navigation modification.');
  console.log('   SharePoint REST API requires "AllSites.Manage" permission (not Sites.Manage.All)');
}

async function uploadLogoViaGraph(token: string, siteId: string): Promise<void> {
  console.log('\n🖼️ Uploading SGA Logo via Graph API...');

  const logoPath = path.resolve(__dirname, '..', 'public', 'assets', 'sga-logo.png');

  if (!fs.existsSync(logoPath)) {
    console.log('  ⚠️ Logo file not found at:', logoPath);
    return;
  }

  const logoBuffer = fs.readFileSync(logoPath);

  // Upload to the site's default drive (Site Assets)
  const uploadUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:/SiteAssets/sga-logo.png:/content`;

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'image/png',
    },
    body: logoBuffer,
  });

  if (response.ok) {
    const data = await response.json();
    console.log('  ✓ Logo uploaded successfully!');
    console.log(`  📍 Location: ${data.webUrl}`);
    console.log('\n  To set as site logo:');
    console.log('  1. Go to ⚙️ Settings → Change the look → Header');
    console.log('  2. Click "Change" under Logo');
    console.log('  3. Browse to Site Assets → sga-logo.png');
  } else {
    const error = await response.text();
    console.log('  ⚠️ Upload response:', response.status, error.substring(0, 200));

    // Try alternative: upload to Shared Documents
    console.log('\n  Trying alternative location...');
    const altUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:/sga-logo.png:/content`;

    const altResponse = await fetch(altUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'image/png',
      },
      body: logoBuffer,
    });

    if (altResponse.ok) {
      const altData = await altResponse.json();
      console.log('  ✓ Logo uploaded to Documents!');
      console.log(`  📍 Location: ${altData.webUrl}`);
    } else {
      console.log('  ✗ Could not upload logo automatically');
    }
  }
}

async function printManualInstructions(): Promise<void> {
  const siteUrl = config.SITE_URL;

  console.log('\n' + '═'.repeat(60));
  console.log('📋 MANUAL NAVIGATION SETUP (Quick Steps)');
  console.log('═'.repeat(60));

  console.log('\n1. Go to: ' + siteUrl);
  console.log('\n2. Click "Edit" at the bottom of the left navigation panel');
  console.log('\n3. Add links in this order:\n');

  const items = [
    '── DOCUMENTS ──',
    'Specifications → /Specifications',
    'Test Methods → /TestMethods',
    'QA Documents → /QADocuments',
    'Site Photos → /SitePhotos',
    'Incident Reports → /IncidentReports',
    '',
    '── LISTS ──',
    'Jobs → /Lists/Jobs',
    'Projects → /Lists/Projects',
    'Tenders → /Lists/Tenders',
    'QA Packs → /Lists/QAPacks',
    'Incidents → /Lists/Incidents',
    'NCRs → /Lists/NCRs',
    'Scope Reports → /Lists/ScopeReports',
    'Foremen → /Lists/Foremen',
    'Division Requests → /Lists/DivisionRequests',
    'Resources → /Lists/Resources',
  ];

  for (const item of items) {
    if (item.startsWith('──')) {
      console.log(`\n   ${item}`);
    } else if (item) {
      console.log(`   • ${item}`);
    }
  }

  console.log('\n4. Click "Save"');

  console.log('\n' + '═'.repeat(60));
  console.log('🎨 THEME & LOGO');
  console.log('═'.repeat(60));
  console.log('\nTo set orange theme:');
  console.log('  ⚙️ → Change the look → Theme → Orange');
  console.log('\nTo set logo:');
  console.log('  ⚙️ → Change the look → Header → Change logo');
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     SGA QA System - SharePoint Navigation Setup            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Get Graph API token (we know this works)
    console.log('🔑 Getting Graph API token...');
    const graphToken = await getGraphToken();
    console.log('  ✓ Graph token acquired');

    // Get site ID
    console.log('\n📍 Getting site information...');
    const siteId = await getSiteId(graphToken);
    console.log('  ✓ Site ID:', siteId);

    // Also get SharePoint token to test
    console.log('\n🔑 Getting SharePoint token...');
    const spToken = await getSharePointToken();
    console.log('  ✓ SharePoint token acquired');

    // Test SharePoint REST API access
    const spAccessible = await testSharePointAccess(spToken);

    if (spAccessible) {
      // If SharePoint REST API works, we can set up navigation
      console.log('\n🎉 SharePoint REST API is accessible! Setting up navigation...');
      // TODO: Implement navigation setup via REST API
    }

    // Upload logo via Graph API
    await uploadLogoViaGraph(graphToken, siteId);

    // Show navigation structure (for reference or manual setup)
    await setupNavigationViaGraph(graphToken, siteId);

    // Print manual instructions
    await printManualInstructions();

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Setup complete! Check the instructions above.');
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
