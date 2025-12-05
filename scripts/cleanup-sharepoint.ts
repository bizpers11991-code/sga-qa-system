import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });

const getConfig = () => ({
  SITE_URL: process.env.SHAREPOINT_SITE_URL,
  CLIENT_ID: process.env.AZURE_CLIENT_ID,
  CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET,
  TENANT_ID: process.env.AZURE_TENANT_ID,
});

// Lists to DELETE (old/duplicate)
const LISTS_TO_DELETE = [
  'DailyReport_Works',
  'DailyReport_Labour',
  'DailyReport_Plant',
  'Daily QA Reports',
  'Job Sheets',
  'Non-Conformance Reports',
  'NCR Documents',
  'Site Photos',
  'Job Photos',
  'QA Packs',
  'Equipment',
  'Crew Members',
  'Corrective Actions',
  'Incident Reports',
  'Events',
];

// Lists to KEEP (don't touch these)
const LISTS_TO_KEEP = [
  'Jobs', 'Projects', 'Tenders', 'Foremen', 'QAPacks', 'Incidents',
  'NCRs', 'ScopeReports', 'DivisionRequests', 'ITPTemplates', 'SamplingPlans',
  'Drafts', 'Notifications', 'Resources',
  'QADocuments', 'SitePhotos', 'IncidentReports', 'NCRDocuments', 'ScopeReportDocs',
  'Documents', 'Web Template Extensions', // System lists
];

async function getAccessToken(): Promise<string> {
  const { TENANT_ID, CLIENT_ID, CLIENT_SECRET } = getConfig();
  const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    client_id: CLIENT_ID!,
    client_secret: CLIENT_SECRET!,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await response.json();
  return data.access_token;
}

async function getSiteId(token: string): Promise<string> {
  const { SITE_URL } = getConfig();
  const url = new URL(SITE_URL!);
  const hostname = url.hostname;
  const sitePath = url.pathname;

  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${hostname}:${sitePath}`;
  const response = await fetch(graphUrl, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  const data = await response.json();
  return data.id;
}

async function getAllLists(token: string, siteId: string) {
  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists`;
  const response = await fetch(graphUrl, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  const data = await response.json();
  return data.value || [];
}

async function deleteList(token: string, siteId: string, listId: string, listName: string) {
  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}`;

  const response = await fetch(graphUrl, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (response.ok || response.status === 204) {
    console.log(`  ✓ Deleted: ${listName}`);
    return true;
  } else {
    const error = await response.text();
    console.log(`  ✗ Failed to delete ${listName}: ${error}`);
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     SharePoint Cleanup - Remove Old/Duplicate Lists        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const token = await getAccessToken();
  const siteId = await getSiteId(token);

  console.log('Site ID:', siteId);
  console.log('\nFetching all lists...\n');

  const lists = await getAllLists(token, siteId);

  console.log(`Found ${lists.length} total lists/libraries\n`);
  console.log('Deleting old/duplicate lists:');
  console.log('────────────────────────────────────────────────────────────');

  let deleted = 0;
  let skipped = 0;

  for (const list of lists) {
    if (LISTS_TO_DELETE.includes(list.displayName)) {
      const success = await deleteList(token, siteId, list.id, list.displayName);
      if (success) deleted++;
    } else if (!LISTS_TO_KEEP.includes(list.displayName)) {
      console.log(`  ? Unknown list (skipped): ${list.displayName}`);
      skipped++;
    }
  }

  console.log('\n────────────────────────────────────────────────────────────');
  console.log(`\n✅ Cleanup Complete!`);
  console.log(`   Deleted: ${deleted} lists`);
  console.log(`   Skipped: ${skipped} unknown lists`);
  console.log(`   Kept: ${LISTS_TO_KEEP.length} SGA + system lists`);
}

main().catch(console.error);
