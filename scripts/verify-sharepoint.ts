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

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     SharePoint Lists Verification                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const token = await getAccessToken();
  const siteId = await getSiteId(token);

  console.log('Site ID:', siteId);
  console.log('\nFetching all lists...\n');

  const lists = await getAllLists(token, siteId);

  // Our expected lists
  const ourLists = ['Jobs', 'Projects', 'Tenders', 'Foremen', 'QAPacks', 'Incidents',
    'NCRs', 'ScopeReports', 'DivisionRequests', 'ITPTemplates', 'SamplingPlans',
    'Drafts', 'Notifications', 'Resources'];

  const ourLibraries = ['QADocuments', 'SitePhotos', 'IncidentReports', 'NCRDocuments', 'ScopeReportDocs'];

  console.log('All Lists on SharePoint:');
  console.log('────────────────────────────────────────────────────────────');

  lists.forEach((list: any) => {
    const isOurs = ourLists.includes(list.displayName) || ourLibraries.includes(list.displayName);
    const template = list.list ? list.list.template : 'unknown';
    const status = isOurs ? '✓ SGA' : '  System/Other';
    console.log(`${status} | ${list.displayName} (${template})`);
  });

  console.log('\n────────────────────────────────────────────────────────────');
  console.log('\nSGA Lists Status:');
  ourLists.forEach(name => {
    const found = lists.find((l: any) => l.displayName === name);
    console.log(`  ${found ? '✓' : '✗'} ${name}`);
  });

  console.log('\nSGA Document Libraries Status:');
  ourLibraries.forEach(name => {
    const found = lists.find((l: any) => l.displayName === name);
    console.log(`  ${found ? '✓' : '✗'} ${name}`);
  });
}

main().catch(console.error);
