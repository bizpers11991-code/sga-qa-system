/**
 * SGA QA System - Update Equipment Divisions
 *
 * Updates existing equipment in SharePoint with correct division classifications:
 * - Asphalt: Pavers, Rollers (Steel, Multi, Pedy), Groovers
 * - Profiling: Profilers, Pocket Rockets, Skid Steers
 * - Transport: All Trucks, Prime Movers, Tippers, Utes, Wagons
 * - Common: Trailers, Lowloaders, Dollies, Forklifts, Brooms
 *
 * Usage: npx tsx scripts/update-equipment-divisions.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local'), override: true });
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: false });

const getConfig = () => ({
  SITE_URL: process.env.SHAREPOINT_SITE_URL,
  CLIENT_ID: process.env.AZURE_CLIENT_ID,
  CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET,
  TENANT_ID: process.env.AZURE_TENANT_ID,
});

// Equipment type to Division mapping
const DIVISION_MAPPING: Record<string, 'Asphalt' | 'Profiling' | 'Spray' | 'Transport' | 'Common'> = {
  // Asphalt Division - Pavers and Rollers
  'PAVER': 'Asphalt',
  'paver': 'Asphalt',
  'STEEL': 'Asphalt',
  'MULTI': 'Asphalt',
  'PEDY': 'Asphalt',
  'ROLLER': 'Asphalt',
  'GROOVER': 'Asphalt',

  // Profiling Division - Profilers and support
  'PROFILER': 'Profiling',
  'POCKET': 'Profiling',
  'SKID': 'Profiling',

  // Transport Division - All trucks and vehicles
  'TRUCK': 'Transport',
  'PM': 'Transport',
  'ET': 'Transport',
  'WF': 'Transport',
  'ST': 'Transport',
  'CREW': 'Transport',
  'CREW TRUCK': 'Transport',
  'WALKING FLOOR': 'Transport',
  'UTE': 'Transport',
  'WAGON': 'Transport',
  'EVEREST': 'Transport',
  'TACK': 'Transport',

  // Common/Support Equipment
  'TRAILER': 'Common',
  'LOADER': 'Common',
  'DOGLOADER': 'Common',
  'DOLLY': 'Common',
  'FORKLIFT': 'Common',
  'TRACTOR BROOM': 'Common',
  'BROOM': 'Common',
};

// Get access token
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

// Get site ID
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

// Get all items from Resources list
async function getResourceItems(token: string, siteId: string): Promise<any[]> {
  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/Resources/items?$expand=fields&$top=500`;

  const response = await fetch(graphUrl, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to get resources: ${await response.text()}`);
  }

  const data = await response.json();
  return data.value || [];
}

// Update item division
async function updateItemDivision(
  token: string,
  siteId: string,
  itemId: string,
  newDivision: string
): Promise<boolean> {
  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/Resources/items/${itemId}/fields`;

  const response = await fetch(graphUrl, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ Division: newDivision }),
  });

  return response.ok;
}

// Parse fleet register to get type mappings
function parseFleetTypes(filePath: string): Map<string, string> {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['TYPES'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][];

  const typeMap = new Map<string, string>();

  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    const assetNumber = row[0]?.toString().trim().replace(/\s+/g, '') || '';
    const type = row[6]?.toString().trim().toUpperCase() || '';

    if (assetNumber.startsWith('SGA') && type) {
      typeMap.set(assetNumber, type);
    }
  }

  return typeMap;
}

// Main function
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     SGA QA System - Update Equipment Divisions             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const { SITE_URL, CLIENT_ID, CLIENT_SECRET, TENANT_ID } = getConfig();

  if (!SITE_URL || !CLIENT_ID || !CLIENT_SECRET || !TENANT_ID) {
    console.error('❌ Missing required environment variables!');
    process.exit(1);
  }

  try {
    // Parse fleet register for type information
    const fleetPath = path.resolve(__dirname, '..', 'docs', 'SGA Fleet', 'Fleet Register CURRENT 160425.xlsx');
    console.log('1. Reading fleet register for type mappings...');
    const typeMap = parseFleetTypes(fleetPath);
    console.log(`   Found ${typeMap.size} equipment type mappings\n`);

    // Get access token
    console.log('2. Acquiring access token...');
    const token = await getAccessToken();
    console.log('   ✓ Access token acquired\n');

    // Get site ID
    console.log('3. Getting SharePoint site ID...');
    const siteId = await getSiteId(token);
    console.log(`   ✓ Site ID acquired\n`);

    // Get all resource items
    console.log('4. Fetching existing equipment from SharePoint...');
    const items = await getResourceItems(token, siteId);
    console.log(`   Found ${items.length} items\n`);

    // Update divisions
    console.log('5. Updating equipment divisions...');
    console.log('─'.repeat(60));

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    const divisionCounts: Record<string, number> = {
      Asphalt: 0,
      Profiling: 0,
      Transport: 0,
      Common: 0,
    };

    for (const item of items) {
      const fields = item.fields;
      const title = fields.Title || '';
      const currentDivision = fields.Division || '';

      // Get type from fleet register
      const equipType = typeMap.get(title);

      if (!equipType) {
        console.log(`   - Skipping ${title} (not in fleet register)`);
        skipped++;
        continue;
      }

      // Determine correct division
      const correctDivision = DIVISION_MAPPING[equipType] || 'Common';

      // Check if update needed
      if (currentDivision === correctDivision) {
        divisionCounts[correctDivision]++;
        skipped++;
        continue;
      }

      // Update division
      const success = await updateItemDivision(token, siteId, item.id, correctDivision);

      if (success) {
        console.log(`   ✓ ${title}: ${currentDivision || 'Shared'} → ${correctDivision}`);
        divisionCounts[correctDivision]++;
        updated++;
      } else {
        console.log(`   ✗ Failed to update ${title}`);
        failed++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('✅ Equipment Division Update Complete!\n');
    console.log('Summary:');
    console.log(`  • Updated: ${updated}`);
    console.log(`  • Skipped (already correct): ${skipped}`);
    console.log(`  • Failed: ${failed}\n`);
    console.log('Division Breakdown:');
    Object.entries(divisionCounts).forEach(([div, count]) => {
      console.log(`  • ${div}: ${count}`);
    });

  } catch (error) {
    console.error('\n❌ Update failed:', error);
    process.exit(1);
  }
}

main();
