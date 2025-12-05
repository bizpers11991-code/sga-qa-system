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
  console.log('Site info:', {
    id: data.id,
    name: data.name,
    displayName: data.displayName,
    webUrl: data.webUrl
  });
  return data.id;
}

async function getListDetails(token: string, siteId: string, listName: string) {
  // Try to get list by display name
  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists?$filter=displayName eq '${listName}'`;
  const response = await fetch(graphUrl, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  const data = await response.json();
  if (data.value && data.value.length > 0) {
    const list = data.value[0];
    return {
      id: list.id,
      name: list.name,
      displayName: list.displayName,
      webUrl: list.webUrl,
      createdDateTime: list.createdDateTime,
      template: list.list?.template,
      hidden: list.list?.hidden
    };
  }
  return null;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     SharePoint Debug - Check List Details                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const { SITE_URL } = getConfig();
  console.log('Configured Site URL:', SITE_URL);
  console.log('');

  const token = await getAccessToken();
  const siteId = await getSiteId(token);

  console.log('\n────────────────────────────────────────────────────────────');
  console.log('Checking SGA Lists:');
  console.log('────────────────────────────────────────────────────────────\n');

  const sgaLists = ['Jobs', 'Projects', 'Tenders', 'Foremen', 'QAPacks', 'Incidents',
    'NCRs', 'ScopeReports', 'DivisionRequests', 'ITPTemplates', 'SamplingPlans',
    'Drafts', 'Notifications', 'Resources'];

  for (const listName of sgaLists) {
    const details = await getListDetails(token, siteId, listName);
    if (details) {
      console.log(`✓ ${listName}`);
      console.log(`  URL: ${details.webUrl}`);
      console.log(`  Created: ${details.createdDateTime}`);
      console.log(`  Hidden: ${details.hidden || false}`);
      console.log('');
    } else {
      console.log(`✗ ${listName} - NOT FOUND`);
      console.log('');
    }
  }

  console.log('────────────────────────────────────────────────────────────');
  console.log('Checking Document Libraries:');
  console.log('────────────────────────────────────────────────────────────\n');

  const sgaLibraries = ['QADocuments', 'SitePhotos', 'IncidentReports', 'NCRDocuments', 'ScopeReportDocs'];

  for (const libName of sgaLibraries) {
    const details = await getListDetails(token, siteId, libName);
    if (details) {
      console.log(`✓ ${libName}`);
      console.log(`  URL: ${details.webUrl}`);
      console.log(`  Created: ${details.createdDateTime}`);
      console.log('');
    } else {
      console.log(`✗ ${libName} - NOT FOUND`);
      console.log('');
    }
  }
}

main().catch(console.error);
