/**
 * SGA QA System - Cleanup Old SharePoint Lists
 *
 * Removes deprecated lists that have been replaced:
 * - Foremen (replaced by CrewMembers)
 *
 * Usage: npx tsx scripts/cleanup-old-lists.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local'), override: true });
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: false });

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

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function getSiteId(token: string): Promise<string> {
  const { SITE_URL } = getConfig();
  const url = new URL(SITE_URL!);
  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${url.hostname}:${url.pathname}`;

  const response = await fetch(graphUrl, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to get site ID: ${await response.text()}`);
  }

  const data = await response.json();
  return data.id;
}

async function deleteList(token: string, siteId: string, listName: string): Promise<boolean> {
  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listName}`;

  // First check if list exists
  const checkResponse = await fetch(graphUrl, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!checkResponse.ok) {
    console.log(`   - List "${listName}" does not exist, skipping`);
    return false;
  }

  // Delete the list
  const deleteResponse = await fetch(graphUrl, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!deleteResponse.ok) {
    const error = await deleteResponse.text();
    console.error(`   ✗ Failed to delete "${listName}": ${error}`);
    return false;
  }

  console.log(`   ✓ Deleted list: ${listName}`);
  return true;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     SGA QA System - Cleanup Old SharePoint Lists               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const { SITE_URL, CLIENT_ID, CLIENT_SECRET, TENANT_ID } = getConfig();

  if (!SITE_URL || !CLIENT_ID || !CLIENT_SECRET || !TENANT_ID) {
    console.error('❌ Missing required environment variables!');
    process.exit(1);
  }

  const LISTS_TO_DELETE = [
    'Foremen', // Replaced by CrewMembers
  ];

  try {
    console.log('1. Acquiring access token...');
    const token = await getAccessToken();
    console.log('   ✓ Access token acquired\n');

    console.log('2. Getting SharePoint site ID...');
    const siteId = await getSiteId(token);
    console.log('   ✓ Site ID acquired\n');

    console.log('3. Deleting deprecated lists...');
    console.log('─'.repeat(60));

    let deleted = 0;
    for (const listName of LISTS_TO_DELETE) {
      const success = await deleteList(token, siteId, listName);
      if (success) deleted++;
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Cleanup Complete!');
    console.log(`   Deleted ${deleted} list(s)`);

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }
}

main();
