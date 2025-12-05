/**
 * SGA QA System - Fleet Register Upload Script
 *
 * This script reads the SGA Fleet Register Excel file and uploads
 * equipment data to the SharePoint Resources list.
 *
 * Equipment Categories:
 * - Asphalt Gear: Pavers, Rollers (Steel, Multi, Pedy), Groovers
 * - Profiling Gear: Profilers, Pocket Rockets
 * - Trucks: All trucks, Prime Movers, Tippers, Crew Trucks
 * - Support Equipment: Trailers, Lowloaders, Dollies, Skid Steers, Forklifts
 * - Light Vehicles: Utes, Wagons
 *
 * Usage: npx tsx scripts/upload-fleet-register.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

// Get the directory of the current file and load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env.local');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath, override: true });

// Also try .env if .env.local doesn't have the vars
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: false });

// SharePoint configuration
const getConfig = () => ({
  SITE_URL: process.env.SHAREPOINT_SITE_URL,
  CLIENT_ID: process.env.AZURE_CLIENT_ID,
  CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET,
  TENANT_ID: process.env.AZURE_TENANT_ID,
});

// Equipment type to SharePoint ResourceType mapping
const TYPE_MAPPING: Record<string, string> = {
  // Asphalt Division
  'PAVER': 'Paver',
  'paver': 'Paver',
  'STEEL': 'Roller',
  'MULTI': 'Roller',
  'PEDY': 'Roller',
  'ROLLER': 'Roller',
  'GROOVER': 'Other Equipment',

  // Profiling Division
  'PROFILER': 'Profiler',
  'POCKET': 'Profiler',

  // Trucks
  'TRUCK': 'Truck',
  'PM': 'Truck', // Prime Mover
  'ET': 'Truck', // End Tipper
  'WF': 'Truck', // Walking Floor
  'ST': 'Truck', // Side Tipper
  'CREW': 'Truck',
  'CREW TRUCK': 'Truck',
  'WALKING FLOOR': 'Truck',

  // Support Equipment
  'TRAILER': 'Other Equipment',
  'LOADER': 'Other Equipment',
  'DOGLOADER': 'Other Equipment',
  'DOLLY': 'Other Equipment',
  'SKID': 'Other Equipment',
  'FORKLIFT': 'Other Equipment',
  'TRACTOR BROOM': 'Other Equipment',
  'BROOM': 'Other Equipment',

  // Light Vehicles
  'UTE': 'Other Equipment',
};

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
  'SKID': 'Profiling', // Skid steers mainly used for profiling cleanup

  // Transport Division - All trucks and vehicles
  'TRUCK': 'Transport',
  'PM': 'Transport',           // Prime Mover
  'ET': 'Transport',           // End Tipper
  'WF': 'Transport',           // Walking Floor
  'ST': 'Transport',           // Side Tipper
  'CREW': 'Transport',         // Crew Truck
  'CREW TRUCK': 'Transport',
  'WALKING FLOOR': 'Transport',
  'UTE': 'Transport',          // Light vehicles
  'WAGON': 'Transport',        // Station wagons
  'EVEREST': 'Transport',
  'TACK': 'Transport',         // Tack trucks

  // Common/Support Equipment - Used by all divisions
  'TRAILER': 'Common',
  'LOADER': 'Common',          // Low loaders
  'DOGLOADER': 'Common',
  'DOLLY': 'Common',
  'FORKLIFT': 'Common',
  'TRACTOR BROOM': 'Common',
  'BROOM': 'Common',
};

interface FleetEquipment {
  assetNumber: string;
  assetCode: string;
  model: string;
  make: string;
  rego: string;
  vin: string;
  type: string;
}

interface SharePointResource {
  Title: string;
  ResourceName: string;
  ResourceType: string;
  Division: string;
  Status: string;
  RegistrationNumber: string;
  Notes: string;
}

// Parse Excel fleet register
function parseFleetRegister(filePath: string): FleetEquipment[] {
  console.log(`\nReading Excel file: ${filePath}`);
  const workbook = XLSX.readFile(filePath);

  // Use the TYPES sheet which has comprehensive equipment data
  const sheet = workbook.Sheets['TYPES'];
  if (!sheet) {
    throw new Error('TYPES sheet not found in workbook');
  }

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][];

  const equipment: FleetEquipment[] = [];

  // Skip header rows (first 2 rows)
  for (let i = 2; i < data.length; i++) {
    const row = data[i];

    // Skip empty rows
    if (!row[0] || !row[0].toString().trim()) continue;

    const assetNumber = row[0]?.toString().trim() || '';
    const assetCode = row[1]?.toString().trim() || '';
    const model = row[2]?.toString().trim() || '';
    const make = row[3]?.toString().trim() || '';
    const rego = row[4]?.toString().trim() || '';
    const vin = row[5]?.toString().trim() || '';
    const type = row[6]?.toString().trim().toUpperCase() || '';

    // Skip if no valid asset number
    if (!assetNumber.startsWith('SGA')) continue;

    equipment.push({
      assetNumber,
      assetCode,
      model,
      make,
      rego,
      vin,
      type,
    });
  }

  console.log(`  Found ${equipment.length} equipment items`);
  return equipment;
}

// Convert fleet equipment to SharePoint resource format
function convertToSharePointResource(equipment: FleetEquipment): SharePointResource {
  const resourceType = TYPE_MAPPING[equipment.type] || 'Other Equipment';
  const division = DIVISION_MAPPING[equipment.type] || 'Shared';

  // Create readable name: "ASPHALT PAVER VOGELE 1303" or "PRIME MOVER MAN"
  const name = `${equipment.model} ${equipment.make}`.trim();

  return {
    Title: equipment.assetNumber.replace(/\s+/g, ''), // SGA001, SGA002, etc.
    ResourceName: name || equipment.model || 'Unknown',
    ResourceType: resourceType,
    Division: division,
    Status: 'Available',
    RegistrationNumber: equipment.rego || 'N/A',
    Notes: `Asset Code: ${equipment.assetCode}\nVIN: ${equipment.vin}\nOriginal Type: ${equipment.type}`,
  };
}

// Get access token using client credentials
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
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Get site ID from SharePoint URL
async function getSiteId(token: string): Promise<string> {
  const { SITE_URL } = getConfig();
  const url = new URL(SITE_URL!);
  const hostname = url.hostname;
  const sitePath = url.pathname;

  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${hostname}:${sitePath}`;

  const response = await fetch(graphUrl, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get site ID: ${error}`);
  }

  const data = await response.json();
  return data.id;
}

// Get list ID by name
async function getListId(token: string, siteId: string, listName: string): Promise<string> {
  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listName}`;

  const response = await fetch(graphUrl, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get list "${listName}": ${error}`);
  }

  const data = await response.json();
  return data.id;
}

// Check if item already exists
async function itemExists(token: string, siteId: string, listId: string, title: string): Promise<boolean> {
  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?$filter=fields/Title eq '${title}'&$select=id`;

  const response = await fetch(graphUrl, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  return data.value && data.value.length > 0;
}

// Create a resource item in SharePoint
async function createResourceItem(
  token: string,
  siteId: string,
  listId: string,
  resource: SharePointResource
): Promise<boolean> {
  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items`;

  const itemData = {
    fields: resource,
  };

  const response = await fetch(graphUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(itemData),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`    ✗ Failed to create ${resource.Title}: ${error}`);
    return false;
  }

  return true;
}

// Main function
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     SGA QA SYSTEM - Fleet Register Upload Script           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  const { SITE_URL, CLIENT_ID, CLIENT_SECRET, TENANT_ID } = getConfig();

  // Validate configuration
  if (!SITE_URL || !CLIENT_ID || !CLIENT_SECRET || !TENANT_ID) {
    console.error('❌ Missing required environment variables!');
    console.error('Required: SHAREPOINT_SITE_URL, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID');
    process.exit(1);
  }

  console.log(`SharePoint Site: ${SITE_URL}`);
  console.log('');

  try {
    // Parse fleet register
    const fleetPath = path.resolve(__dirname, '..', 'docs', 'SGA Fleet', 'Fleet Register CURRENT 160425.xlsx');
    const equipment = parseFleetRegister(fleetPath);

    // Convert to SharePoint format
    const resources = equipment.map(convertToSharePointResource);

    // Categorize for summary
    const categories: Record<string, number> = {};
    const divisions: Record<string, number> = {};
    resources.forEach(r => {
      categories[r.ResourceType] = (categories[r.ResourceType] || 0) + 1;
      divisions[r.Division] = (divisions[r.Division] || 0) + 1;
    });

    console.log('\nEquipment Categories:');
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`  • ${cat}: ${count}`);
    });

    console.log('\nBy Division:');
    Object.entries(divisions).forEach(([div, count]) => {
      console.log(`  • ${div}: ${count}`);
    });

    // Get access token
    console.log('\n1. Acquiring access token...');
    const token = await getAccessToken();
    console.log('   ✓ Access token acquired');

    // Get site ID
    console.log('\n2. Getting SharePoint site ID...');
    const siteId = await getSiteId(token);
    console.log(`   ✓ Site ID: ${siteId.substring(0, 50)}...`);

    // Get Resources list ID
    console.log('\n3. Getting Resources list...');
    const listId = await getListId(token, siteId, 'Resources');
    console.log(`   ✓ List ID: ${listId}`);

    // Upload resources
    console.log('\n4. Uploading equipment to SharePoint...');
    console.log('─'.repeat(60));

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const resource of resources) {
      // Check if already exists
      const exists = await itemExists(token, siteId, listId, resource.Title);
      if (exists) {
        console.log(`   - Skipping ${resource.Title} (already exists)`);
        skipped++;
        continue;
      }

      // Create item
      const success = await createResourceItem(token, siteId, listId, resource);
      if (success) {
        console.log(`   ✓ Created ${resource.Title}: ${resource.ResourceName}`);
        created++;
      } else {
        failed++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('✅ Fleet Register Upload Complete!');
    console.log('');
    console.log('Summary:');
    console.log(`  • Created: ${created}`);
    console.log(`  • Skipped (existing): ${skipped}`);
    console.log(`  • Failed: ${failed}`);
    console.log(`  • Total processed: ${resources.length}`);

  } catch (error) {
    console.error('\n❌ Upload failed:', error);
    process.exit(1);
  }
}

// Run
main();
