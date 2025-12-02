/**
 * Enhanced SharePoint Navigation Setup Script
 *
 * This script creates a comprehensive, user-friendly navigation structure
 * for the SGA QA System SharePoint site with proper menus and submenus.
 *
 * Features:
 * - Organized navigation with logical groupings
 * - Document libraries and lists under appropriate menus
 * - Quick launch and hub navigation
 * - Step-by-step manual instructions if API access is limited
 *
 * Usage: npx tsx scripts/setup-sharepoint-enhanced-nav.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local'), override: true });
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });

// Configuration
const config = {
  SITE_URL: process.env.SHAREPOINT_SITE_URL || '',
  CLIENT_ID: process.env.AZURE_CLIENT_ID || '',
  CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET || '',
  TENANT_ID: process.env.AZURE_TENANT_ID || '',
};

// Navigation Structure Definition
interface NavItem {
  title: string;
  url: string;
  icon?: string;
  isExternal?: boolean;
  children?: NavItem[];
}

interface NavSection {
  heading: string;
  items: NavItem[];
}

// Define the comprehensive navigation structure
const NAVIGATION_STRUCTURE: NavSection[] = [
  {
    heading: 'HOME',
    items: [
      { title: 'Dashboard', url: '/', icon: 'Home' },
      { title: 'Site Contents', url: '/_layouts/15/viewlsts.aspx', icon: 'AllApps' },
    ]
  },
  {
    heading: 'WORK MANAGEMENT',
    items: [
      {
        title: 'Jobs & Projects',
        url: '#',
        icon: 'Work',
        children: [
          { title: 'All Jobs', url: '/Lists/Jobs' },
          { title: 'Active Projects', url: '/Lists/Projects' },
          { title: 'Tender Handovers', url: '/Lists/Tenders' },
          { title: 'Division Requests', url: '/Lists/DivisionRequests' },
        ]
      },
      {
        title: 'Scheduling',
        url: '#',
        icon: 'Calendar',
        children: [
          { title: 'Scope Reports', url: '/Lists/ScopeReports' },
          { title: 'Resources', url: '/Lists/Resources' },
          { title: 'Foremen', url: '/Lists/Foremen' },
        ]
      },
    ]
  },
  {
    heading: 'QUALITY ASSURANCE',
    items: [
      {
        title: 'QA Documents',
        url: '#',
        icon: 'DocumentSet',
        children: [
          { title: 'QA Packs', url: '/Lists/QAPacks' },
          { title: 'QA Documents Library', url: '/QADocuments' },
          { title: 'ITP Templates', url: '/Lists/ITPTemplates' },
          { title: 'Sampling Plans', url: '/Lists/SamplingPlans' },
        ]
      },
      {
        title: 'Issues & NCRs',
        url: '#',
        icon: 'Warning',
        children: [
          { title: 'Non-Conformance Reports', url: '/Lists/NCRs' },
          { title: 'NCR Documents', url: '/NCRDocuments' },
        ]
      },
    ]
  },
  {
    heading: 'SAFETY & INCIDENTS',
    items: [
      {
        title: 'Safety Management',
        url: '#',
        icon: 'Shield',
        children: [
          { title: 'Incident Reports', url: '/Lists/Incidents' },
          { title: 'Incident Documents', url: '/IncidentReports' },
          { title: 'Site Photos', url: '/SitePhotos' },
        ]
      },
    ]
  },
  {
    heading: 'DOCUMENTS',
    items: [
      {
        title: 'Document Libraries',
        url: '#',
        icon: 'FolderOpen',
        children: [
          { title: 'QA Documents', url: '/QADocuments' },
          { title: 'Site Photos', url: '/SitePhotos' },
          { title: 'Incident Reports', url: '/IncidentReports' },
          { title: 'NCR Documents', url: '/NCRDocuments' },
          { title: 'Scope Report Docs', url: '/ScopeReportDocs' },
        ]
      },
    ]
  },
  {
    heading: 'SYSTEM',
    items: [
      {
        title: 'System Lists',
        url: '#',
        icon: 'Settings',
        children: [
          { title: 'Drafts', url: '/Lists/Drafts' },
          { title: 'Notifications', url: '/Lists/Notifications' },
          { title: 'Daily Reports', url: '/Lists/DailyReports' },
          { title: 'Activity Log', url: '/Lists/ActivityLog' },
        ]
      },
    ]
  },
];

// Quick Access Links (top of navigation)
const QUICK_ACCESS: NavItem[] = [
  { title: 'New Job', url: '/Lists/Jobs/NewForm.aspx', icon: 'Add' },
  { title: 'New QA Pack', url: '/Lists/QAPacks/NewForm.aspx', icon: 'DocumentAdd' },
  { title: 'Report Incident', url: '/Lists/Incidents/NewForm.aspx', icon: 'Warning' },
];

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
    throw new Error(`Failed to get Graph token: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

// Get site ID
async function getSiteId(token: string): Promise<string> {
  const url = new URL(config.SITE_URL);
  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${url.hostname}:${url.pathname}`;

  const response = await fetch(graphUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  if (!data.id) {
    throw new Error(`Failed to get site ID: ${JSON.stringify(data)}`);
  }
  return data.id;
}

// Verify lists exist
async function verifyLists(token: string, siteId: string): Promise<{ found: string[], missing: string[] }> {
  const response = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  const existingLists = new Set((data.value || []).map((list: any) => list.displayName.toLowerCase()));

  const expectedLists = [
    'Jobs', 'Projects', 'Tenders', 'ScopeReports', 'DivisionRequests',
    'QAPacks', 'Incidents', 'NCRs', 'Foremen', 'Resources',
    'ITPTemplates', 'SamplingPlans', 'Drafts', 'Notifications',
    'DailyReports', 'ActivityLog',
    // Document Libraries
    'QADocuments', 'SitePhotos', 'IncidentReports', 'NCRDocuments', 'ScopeReportDocs'
  ];

  const found: string[] = [];
  const missing: string[] = [];

  for (const list of expectedLists) {
    if (existingLists.has(list.toLowerCase())) {
      found.push(list);
    } else {
      missing.push(list);
    }
  }

  return { found, missing };
}

// Generate PowerShell script for manual navigation setup
function generatePowerShellScript(): string {
  const script = `
# SharePoint Online Navigation Setup Script
# Run this in PowerShell with PnP.PowerShell module installed

# Install PnP.PowerShell if not already installed
# Install-Module -Name PnP.PowerShell -Scope CurrentUser -Force

# Connect to SharePoint (will prompt for credentials)
$siteUrl = "${config.SITE_URL}"
Connect-PnPOnline -Url $siteUrl -Interactive

# Clear existing quick launch navigation
$quickLaunch = Get-PnPNavigationNode -Location QuickLaunch
foreach ($node in $quickLaunch) {
    Remove-PnPNavigationNode -Identity $node.Id -Force
}

# Add Quick Access section
Write-Host "Adding Quick Access links..."
${QUICK_ACCESS.map(item => `Add-PnPNavigationNode -Location QuickLaunch -Title "${item.title}" -Url "${item.url}"`).join('\n')}

# Add Navigation Sections
${NAVIGATION_STRUCTURE.map(section => {
  const sectionCode: string[] = [];
  sectionCode.push(`\nWrite-Host "Adding ${section.heading} section..."`);

  for (const item of section.items) {
    if (item.children && item.children.length > 0) {
      // Parent with children
      sectionCode.push(`$parent = Add-PnPNavigationNode -Location QuickLaunch -Title "${item.title}" -Url "#"`);
      for (const child of item.children) {
        sectionCode.push(`Add-PnPNavigationNode -Location QuickLaunch -Title "${child.title}" -Url "${child.url}" -Parent $parent.Id`);
      }
    } else {
      // Simple item
      sectionCode.push(`Add-PnPNavigationNode -Location QuickLaunch -Title "${item.title}" -Url "${item.url}"`);
    }
  }
  return sectionCode.join('\n');
}).join('\n')}

Write-Host "Navigation setup complete!" -ForegroundColor Green
Disconnect-PnPOnline
`;

  return script;
}

// Generate detailed manual instructions
function generateManualInstructions(): void {
  console.log('\n' + '='.repeat(70));
  console.log('SHAREPOINT NAVIGATION SETUP - MANUAL INSTRUCTIONS');
  console.log('='.repeat(70));

  console.log('\n1. OPEN YOUR SHAREPOINT SITE');
  console.log(`   URL: ${config.SITE_URL}`);

  console.log('\n2. EDIT NAVIGATION');
  console.log('   - Click the gear icon (Settings) in the top right');
  console.log('   - Select "Change the look"');
  console.log('   - Click "Navigation" on the left');
  console.log('   - Or: Click "Edit" at the bottom of the left navigation panel');

  console.log('\n3. ADD NAVIGATION STRUCTURE');
  console.log('   Add the following links in order:\n');

  for (const section of NAVIGATION_STRUCTURE) {
    console.log(`   ${section.heading}`);
    console.log('   ' + '-'.repeat(40));

    for (const item of section.items) {
      if (item.children && item.children.length > 0) {
        console.log(`   + ${item.title} (Parent Menu)`);
        for (const child of item.children) {
          console.log(`     └─ ${child.title}`);
          console.log(`        URL: ${child.url}`);
        }
      } else {
        console.log(`   + ${item.title}`);
        console.log(`     URL: ${item.url}`);
      }
    }
    console.log('');
  }

  console.log('\n4. QUICK ACCESS LINKS (Optional)');
  console.log('   Add these at the top for common actions:\n');
  for (const item of QUICK_ACCESS) {
    console.log(`   + ${item.title} -> ${item.url}`);
  }

  console.log('\n5. SAVE CHANGES');
  console.log('   Click "Save" when done editing navigation');

  console.log('\n' + '='.repeat(70));
}

// Generate homepage web parts configuration
function generateHomepageConfig(): void {
  console.log('\n' + '='.repeat(70));
  console.log('SHAREPOINT HOMEPAGE CONFIGURATION');
  console.log('='.repeat(70));

  console.log('\nRecommended Homepage Layout:');
  console.log('\n1. HERO SECTION');
  console.log('   - Add a Hero web part at the top');
  console.log('   - Title: "SGA Quality Assurance System"');
  console.log('   - Add quick links to: New Job, New QA Pack, Report Incident');

  console.log('\n2. QUICK LINKS WEB PART');
  console.log('   Add a Quick Links web part with these tiles:');
  console.log('   - Jobs Dashboard');
  console.log('   - Projects');
  console.log('   - QA Packs');
  console.log('   - Incidents');
  console.log('   - Resources');

  console.log('\n3. RECENT DOCUMENTS WEB PART');
  console.log('   - Add a Document Library web part');
  console.log('   - Configure to show recent QA Documents');

  console.log('\n4. ACTIVITY FEED');
  console.log('   - Add an Activity web part');
  console.log('   - Shows recent list item changes');

  console.log('\n5. WEATHER WEB PART (Optional)');
  console.log('   - Useful for planning outdoor work');
  console.log('   - Set to Melbourne, VIC or your location');

  console.log('\n' + '='.repeat(70));
}

// Main function
async function main() {
  console.log('=' .repeat(70));
  console.log('  SGA QA SYSTEM - Enhanced SharePoint Navigation Setup');
  console.log('='.repeat(70));

  // Validate config
  if (!config.SITE_URL || !config.TENANT_ID) {
    console.error('\nMissing required environment variables!');
    console.error('Required: SHAREPOINT_SITE_URL, AZURE_TENANT_ID');
    generateManualInstructions();
    generateHomepageConfig();
    process.exit(1);
  }

  console.log(`\nSite: ${config.SITE_URL}`);
  console.log(`Tenant: ${config.TENANT_ID}`);

  try {
    // Get tokens
    console.log('\n1. Authenticating...');
    const token = await getGraphToken();
    console.log('   Graph API token acquired');

    // Get site ID
    console.log('\n2. Getting site information...');
    const siteId = await getSiteId(token);
    console.log(`   Site ID: ${siteId}`);

    // Verify lists
    console.log('\n3. Verifying lists and libraries...');
    const { found, missing } = await verifyLists(token, siteId);

    console.log(`   Found: ${found.length} lists/libraries`);
    if (missing.length > 0) {
      console.log(`   Missing: ${missing.length} lists/libraries`);
      console.log('   Missing items:');
      missing.forEach(m => console.log(`     - ${m}`));
      console.log('\n   Run "npx tsx scripts/setup-sharepoint.ts" to create missing lists.');
    } else {
      console.log('   All expected lists and libraries exist!');
    }

    // Generate PowerShell script
    console.log('\n4. Generating PowerShell script...');
    const psScript = generatePowerShellScript();
    const scriptPath = path.resolve(__dirname, 'setup-nav.ps1');
    fs.writeFileSync(scriptPath, psScript, 'utf-8');
    console.log(`   Script saved: ${scriptPath}`);
    console.log('   Run with: powershell -ExecutionPolicy Bypass -File scripts/setup-nav.ps1');

  } catch (error) {
    console.log(`\nAPI access limited: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log('Generating manual instructions instead...');
  }

  // Always show manual instructions and homepage config
  generateManualInstructions();
  generateHomepageConfig();

  console.log('\n' + '='.repeat(70));
  console.log('SETUP COMPLETE!');
  console.log('='.repeat(70));
  console.log('\nOptions for applying navigation:');
  console.log('1. Run PowerShell script (requires PnP.PowerShell module)');
  console.log('2. Follow manual instructions above');
  console.log('3. Use SharePoint admin center for bulk navigation changes');
  console.log('');
}

main().catch(console.error);
