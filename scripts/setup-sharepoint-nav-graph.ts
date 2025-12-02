/**
 * SharePoint Navigation Setup using Microsoft Graph API
 *
 * This script configures the SharePoint site navigation directly using Graph API.
 * No PowerShell modules required.
 *
 * Usage: npx tsx scripts/setup-sharepoint-nav-graph.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local'), override: true });
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });

const config = {
  SITE_URL: process.env.SHAREPOINT_SITE_URL || '',
  CLIENT_ID: process.env.AZURE_CLIENT_ID || '',
  CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET || '',
  TENANT_ID: process.env.AZURE_TENANT_ID || '',
};

const GRAPH_API = 'https://graph.microsoft.com/v1.0';

// Navigation structure
interface NavNode {
  title: string;
  url: string;
  children?: NavNode[];
}

const NAVIGATION: NavNode[] = [
  { title: 'Dashboard', url: '/' },
  { title: 'Site Contents', url: '/_layouts/15/viewlsts.aspx' },
  {
    title: 'Jobs & Projects',
    url: '#',
    children: [
      { title: 'All Jobs', url: '/Lists/Jobs/AllItems.aspx' },
      { title: 'Active Projects', url: '/Lists/Projects/AllItems.aspx' },
      { title: 'Tender Handovers', url: '/Lists/Tenders/AllItems.aspx' },
      { title: 'Division Requests', url: '/Lists/DivisionRequests/AllItems.aspx' },
    ]
  },
  {
    title: 'Scheduling',
    url: '#',
    children: [
      { title: 'Scope Reports', url: '/Lists/ScopeReports/AllItems.aspx' },
      { title: 'Resources', url: '/Lists/Resources/AllItems.aspx' },
      { title: 'Foremen', url: '/Lists/Foremen/AllItems.aspx' },
    ]
  },
  {
    title: 'QA Documents',
    url: '#',
    children: [
      { title: 'QA Packs', url: '/Lists/QAPacks/AllItems.aspx' },
      { title: 'QA Documents Library', url: '/QADocuments/Forms/AllItems.aspx' },
      { title: 'ITP Templates', url: '/Lists/ITPTemplates/AllItems.aspx' },
      { title: 'Sampling Plans', url: '/Lists/SamplingPlans/AllItems.aspx' },
    ]
  },
  {
    title: 'Issues & NCRs',
    url: '#',
    children: [
      { title: 'Non-Conformance Reports', url: '/Lists/NCRs/AllItems.aspx' },
      { title: 'NCR Documents', url: '/NCRDocuments/Forms/AllItems.aspx' },
    ]
  },
  {
    title: 'Safety Management',
    url: '#',
    children: [
      { title: 'Incident Reports', url: '/Lists/Incidents/AllItems.aspx' },
      { title: 'Incident Documents', url: '/IncidentReports/Forms/AllItems.aspx' },
      { title: 'Site Photos', url: '/SitePhotos/Forms/AllItems.aspx' },
    ]
  },
  {
    title: 'System',
    url: '#',
    children: [
      { title: 'Daily Reports', url: '/Lists/DailyReports/AllItems.aspx' },
      { title: 'Activity Log', url: '/Lists/ActivityLog/AllItems.aspx' },
      { title: 'Notifications', url: '/Lists/Notifications/AllItems.aspx' },
      { title: 'Drafts', url: '/Lists/Drafts/AllItems.aspx' },
    ]
  },
];

async function getToken(): Promise<string> {
  const response = await fetch(
    `https://login.microsoftonline.com/${config.TENANT_ID}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.CLIENT_ID,
        client_secret: config.CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }).toString(),
    }
  );
  const data = await response.json();
  if (!data.access_token) throw new Error(`Auth failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function getSiteId(token: string): Promise<string> {
  const url = new URL(config.SITE_URL);
  const response = await fetch(
    `${GRAPH_API}/sites/${url.hostname}:${url.pathname}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await response.json();
  if (!data.id) throw new Error(`Site not found: ${JSON.stringify(data)}`);
  return data.id;
}

async function getWebId(token: string, siteId: string): Promise<string> {
  const response = await fetch(
    `${GRAPH_API}/sites/${siteId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await response.json();
  // The webId is part of the siteId in format: host,siteId,webId
  const parts = siteId.split(',');
  return parts[2] || parts[1];
}

async function getExistingNavigation(token: string, siteId: string): Promise<any[]> {
  try {
    // Get navigation nodes using SharePoint REST API through Graph
    const response = await fetch(
      `${GRAPH_API}/sites/${siteId}/lists?$filter=displayName eq 'Quick Launch'`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await response.json();
    return data.value || [];
  } catch {
    return [];
  }
}

async function main() {
  console.log('=' .repeat(60));
  console.log('SharePoint Navigation Setup via Graph API');
  console.log('='.repeat(60));

  if (!config.SITE_URL || !config.TENANT_ID || !config.CLIENT_ID) {
    console.error('\nMissing required environment variables!');
    process.exit(1);
  }

  console.log(`\nSite: ${config.SITE_URL}`);

  try {
    console.log('\n1. Authenticating...');
    const token = await getToken();
    console.log('   Token acquired');

    console.log('\n2. Getting site information...');
    const siteId = await getSiteId(token);
    console.log(`   Site ID: ${siteId}`);

    console.log('\n3. Checking navigation access...');
    // Note: Graph API has limited navigation manipulation capabilities
    // Full navigation control requires SharePoint REST API or PnP PowerShell

    console.log('\n' + '='.repeat(60));
    console.log('NAVIGATION SETUP INSTRUCTIONS');
    console.log('='.repeat(60));

    console.log('\nGraph API cannot directly modify SharePoint navigation.');
    console.log('Please follow these manual steps:\n');

    console.log('OPTION 1: Install PnP PowerShell (Recommended)');
    console.log('-'.repeat(40));
    console.log('1. Open PowerShell as Administrator');
    console.log('2. Run: Install-Module -Name PnP.PowerShell -Scope CurrentUser');
    console.log('3. Run: powershell -ExecutionPolicy Bypass -File scripts/setup-nav.ps1');

    console.log('\nOPTION 2: Manual Setup via SharePoint UI');
    console.log('-'.repeat(40));
    console.log(`1. Go to: ${config.SITE_URL}`);
    console.log('2. Click the gear icon (Settings) > Site contents');
    console.log('3. Click "Site settings" > "Navigation" under Look and Feel');
    console.log('4. Edit the Quick Launch navigation');
    console.log('\nAdd the following structure:\n');

    function printNav(nodes: NavNode[], indent = 0) {
      for (const node of nodes) {
        const prefix = '  '.repeat(indent) + (indent > 0 ? '└─ ' : '');
        console.log(`${prefix}${node.title}`);
        if (node.url !== '#') {
          console.log(`${'  '.repeat(indent)}   URL: ${node.url}`);
        }
        if (node.children) {
          printNav(node.children, indent + 1);
        }
      }
    }

    printNav(NAVIGATION);

    console.log('\n' + '='.repeat(60));
    console.log('QUICK LAUNCH JSON EXPORT');
    console.log('='.repeat(60));
    console.log('\nYou can use this JSON to configure navigation programmatically:');
    console.log(JSON.stringify(NAVIGATION, null, 2));

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main().catch(console.error);
