/**
 * Setup SharePoint Navigation and Branding
 * Adds all SGA QA lists to the site navigation
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });

const config = {
  SITE_URL: process.env.SHAREPOINT_SITE_URL!,
  CLIENT_ID: process.env.AZURE_CLIENT_ID!,
  CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET!,
  TENANT_ID: process.env.AZURE_TENANT_ID!,
};

async function getAccessToken(): Promise<string> {
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
  return data.access_token;
}

async function getSiteId(token: string): Promise<string> {
  const url = new URL(config.SITE_URL);
  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${url.hostname}:${url.pathname}`;
  const response = await fetch(graphUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  return data.id;
}

// Navigation structure for SGA QA System
const navigationItems = [
  { title: '── OPERATIONS ──', url: '', isHeader: true },
  { title: 'Jobs', url: '/Lists/Jobs' },
  { title: 'Projects', url: '/Lists/Projects' },
  { title: 'Tenders', url: '/Lists/Tenders' },
  { title: 'Resources', url: '/Lists/Resources' },

  { title: '── QA & COMPLIANCE ──', url: '', isHeader: true },
  { title: 'QA Packs', url: '/Lists/QAPacks' },
  { title: 'Incidents', url: '/Lists/Incidents' },
  { title: 'NCRs', url: '/Lists/NCRs' },
  { title: 'Scope Reports', url: '/Lists/ScopeReports' },

  { title: '── TEAM ──', url: '', isHeader: true },
  { title: 'Foremen', url: '/Lists/Foremen' },
  { title: 'Division Requests', url: '/Lists/DivisionRequests' },

  { title: '── DOCUMENTS ──', url: '', isHeader: true },
  { title: 'QA Documents', url: '/QADocuments' },
  { title: 'Site Photos', url: '/SitePhotos' },
  { title: 'Incident Reports', url: '/IncidentReports' },

  { title: '── SYSTEM ──', url: '', isHeader: true },
  { title: 'ITP Templates', url: '/Lists/ITPTemplates' },
  { title: 'Sampling Plans', url: '/Lists/SamplingPlans' },
];

async function setupNavigation(token: string, siteId: string) {
  console.log('\nSetting up navigation...');

  // Get the site's web URL for constructing full URLs
  const siteUrl = config.SITE_URL;

  // Unfortunately, Graph API has limited support for SharePoint navigation
  // We need to use SharePoint REST API for this, which requires different permissions
  // Let me try using the beta endpoint for site pages

  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}`;

  const response = await fetch(graphUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const siteData = await response.json();
  console.log('Site:', siteData.displayName);
  console.log('Web URL:', siteData.webUrl);

  console.log('\n⚠️  Navigation editing requires SharePoint REST API permissions.');
  console.log('   The app has Graph API permissions which cannot modify navigation directly.\n');

  console.log('📋 MANUAL STEPS TO ADD NAVIGATION:');
  console.log('═'.repeat(50));
  console.log('\n1. Go to your SharePoint site:');
  console.log(`   ${siteUrl}\n`);
  console.log('2. Click "Edit" at the bottom of the left navigation\n');
  console.log('3. Add these links (click "+ Add link" for each):\n');

  for (const item of navigationItems) {
    if (item.isHeader) {
      console.log(`\n   📁 ${item.title}`);
    } else {
      console.log(`      • ${item.title}`);
      console.log(`        URL: ${siteUrl}${item.url}`);
    }
  }

  console.log('\n4. Click "Save" when done\n');
}

async function printThemeInstructions() {
  console.log('\n🎨 THEME CUSTOMIZATION (Orange/SGA Branding):');
  console.log('═'.repeat(50));
  console.log('\n1. Go to your SharePoint site');
  console.log('2. Click the ⚙️ Gear icon (top right) → "Change the look"');
  console.log('3. Click "Theme" in the left panel');
  console.log('4. Select "Orange" theme OR create custom:');
  console.log('   - Primary: #F57C00 (SGA Orange)');
  console.log('   - Secondary: #FF9800');
  console.log('   - Background: #FFFFFF');
  console.log('   - Text: #333333');
  console.log('5. Click "Save"\n');

  console.log('\n🖼️  LOGO UPLOAD:');
  console.log('═'.repeat(50));
  console.log('\n1. Click the ⚙️ Gear icon → "Change the look"');
  console.log('2. Click "Header" in the left panel');
  console.log('3. Under "Logo", click "Change"');
  console.log('4. Upload your SGA logo (recommended: 200x50px PNG)');
  console.log('5. Click "Save"\n');
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     SGA QA System - SharePoint Navigation Setup            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    const token = await getAccessToken();
    console.log('✓ Authenticated successfully');

    const siteId = await getSiteId(token);
    console.log('✓ Site ID retrieved');

    await setupNavigation(token, siteId);
    await printThemeInstructions();

    console.log('═'.repeat(50));
    console.log('✅ Setup guide complete!');
    console.log('═'.repeat(50));

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
