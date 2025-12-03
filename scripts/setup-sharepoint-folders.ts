/**
 * Setup SharePoint Folder Structure
 *
 * Creates organized folder structure in Specifications and TestMethods libraries
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });

const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

const config = {
  SITE_URL: process.env.SHAREPOINT_SITE_URL!,
  CLIENT_ID: process.env.AZURE_CLIENT_ID!,
  CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET!,
  TENANT_ID: process.env.AZURE_TENANT_ID!,
};

// Folder structure to create
const FOLDER_STRUCTURE = {
  'Specifications': [
    'Main Roads WA',
    'Australian Standards',
    'IPWEA Guidelines',
    'Client Specific',
  ],
  'TestMethods': [
    'Asphalt Tests',
    'Bitumen Tests',
    'Density Tests',
    'Sampling Procedures',
    'Surface Tests',
  ],
};

// File mappings - which files go into which folders
const FILE_MAPPINGS: Record<string, Record<string, string[]>> = {
  'Specifications': {
    'Main Roads WA': [
      'specification-201-quality-management.pdf',
      'specification-501-pavements-doc.pdf',
      'specification-502-stone-mastic-asphalt.pdf',
      'specification-503-bituminous-surfacing.pdf',
      'specification-504-asphalt-wearing-course.pdf',
      'specification-505-segmental-paving.pdf',
      'specification-506-enrichment-seals.pdf',
      'specification-507-microsurfacing.pdf',
      'specification-508-cold-planing.pdf',
      'specification-509-polymer-modified-bituminous-surfacing.pdf',
      'specification-510-asphalt-intermediate-course.pdf',
      'specification-511-materials-for-bituminous-treatments.pdf',
      'specification-515-in-situ-stabilisation-of-pavement-materials.pdf',
      'specification-516-crumb-rubber-open-graded-asphalt-pdf.pdf',
      'specification-517-crumb-rubber-gap-graded-asphalt-pdf.pdf',
    ],
    'IPWEA Guidelines': [
      'IPWEA_AfPA_Asphalt_Specification.pdf',
    ],
    'Australian Standards': [
      'Engineering Road Note- 9 Procedure-for-the-design-of-road-pavements.pdf',
    ],
  },
  'TestMethods': {
    'Asphalt Tests': [
      'bulk-density-and-void-content-of-asphalt.pdf',
      'bulk-density-and-void-content-of-asphalt-vacuum-sealing-method.pdf',
      'maximum-density-of-asphalt-rice-method.pdf',
      'preparation-of-asphalt-for-testing.pdf',
      'sampling-and-storage-of-asphalt.pdf',
      'stability-and-flow-of-asphalt-marshall-method.pdf',
      'wa-730.1-bitumen-content-and-particle-size-distribution-of-asphalt-and-stabilised-soil-centrifuge.pdf',
      'wa-730.2-bitumen-content-and-particle-size-distribution-of-asphalt-ignition-oven-method.pdf',
    ],
    'Bitumen Tests': [
      'assessment-of-liquid-adhesion-agents.pdf',
      'density-of-bituminous-materials-and-oils.pdf',
      'determination-of-bitumen-durability-using-a-dynamic-shear-rheometer-dsr.pdf',
      'dispersion-of-bitumen-in-soil.pdf',
      'stone-coating-and-water-resistance-test-cationic-bituminous-emulsions.pdf',
    ],
    'Sampling Procedures': [
      'sampling-procedures-for-bitumen-and-oils.pdf',
    ],
    'Surface Tests': [
      'ATM-453-22_Surface_Deviation_Using_Straightedge_v1.1.pdf',
    ],
    'Density Tests': [
      'determination-of-the-density-of-thin-polythene-plastic-film.pdf',
    ],
  },
};

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
    throw new Error('Failed to get Graph token: ' + JSON.stringify(data));
  }
  return data.access_token;
}

async function getSiteId(token: string): Promise<string> {
  const url = new URL(config.SITE_URL);
  const graphUrl = `${GRAPH_API_BASE}/sites/${url.hostname}:${url.pathname}`;
  const response = await fetch(graphUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  return data.id;
}

async function getDriveId(token: string, siteId: string, libraryName: string): Promise<string> {
  const listUrl = `${GRAPH_API_BASE}/sites/${siteId}/lists?$filter=displayName eq '${libraryName}'`;
  const listResponse = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const listData = await listResponse.json();
  if (!listData.value || listData.value.length === 0) {
    throw new Error(`Library ${libraryName} not found`);
  }

  const driveUrl = `${GRAPH_API_BASE}/sites/${siteId}/lists/${listData.value[0].id}/drive`;
  const driveResponse = await fetch(driveUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const driveData = await driveResponse.json();
  return driveData.id;
}

async function createFolder(
  token: string,
  siteId: string,
  driveId: string,
  folderName: string,
  parentPath: string = ''
): Promise<boolean> {
  const parentUrl = parentPath
    ? `${GRAPH_API_BASE}/sites/${siteId}/drives/${driveId}/root:/${parentPath}:/children`
    : `${GRAPH_API_BASE}/sites/${siteId}/drives/${driveId}/root/children`;

  const response = await fetch(parentUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      folder: {},
      '@microsoft.graph.conflictBehavior': 'fail',
    }),
  });

  if (response.ok) {
    return true;
  } else if (response.status === 409) {
    // Folder already exists
    return true;
  } else {
    const error = await response.text();
    console.log(`    Warning: ${error.substring(0, 100)}`);
    return false;
  }
}

async function moveFile(
  token: string,
  siteId: string,
  driveId: string,
  fileName: string,
  targetFolder: string
): Promise<boolean> {
  // First, find the file in root
  const searchUrl = `${GRAPH_API_BASE}/sites/${siteId}/drives/${driveId}/root:/${fileName}`;
  const searchResponse = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!searchResponse.ok) {
    return false; // File not found in root
  }

  const fileData = await searchResponse.json();
  const fileId = fileData.id;

  // Get target folder ID
  const folderUrl = `${GRAPH_API_BASE}/sites/${siteId}/drives/${driveId}/root:/${targetFolder}`;
  const folderResponse = await fetch(folderUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!folderResponse.ok) {
    console.log(`    Target folder not found: ${targetFolder}`);
    return false;
  }

  const folderData = await folderResponse.json();

  // Move the file
  const moveUrl = `${GRAPH_API_BASE}/sites/${siteId}/drives/${driveId}/items/${fileId}`;
  const moveResponse = await fetch(moveUrl, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parentReference: {
        id: folderData.id,
      },
    }),
  });

  return moveResponse.ok;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Setup SharePoint Folder Structure                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    console.log('🔑 Authenticating...');
    const token = await getGraphToken();
    const siteId = await getSiteId(token);
    console.log('  ✓ Authenticated\n');

    // Create folders in each library
    for (const [library, folders] of Object.entries(FOLDER_STRUCTURE)) {
      console.log(`📁 Setting up ${library} library...`);

      const driveId = await getDriveId(token, siteId, library);

      for (const folder of folders) {
        const created = await createFolder(token, siteId, driveId, folder);
        console.log(`  ${created ? '✓' : '✗'} ${folder}`);
      }
      console.log('');
    }

    // Move files to appropriate folders
    console.log('📂 Organizing files into folders...\n');

    for (const [library, folderMappings] of Object.entries(FILE_MAPPINGS)) {
      console.log(`📁 ${library}:`);
      const driveId = await getDriveId(token, siteId, library);

      for (const [folder, files] of Object.entries(folderMappings)) {
        console.log(`  📂 ${folder}:`);
        for (const file of files) {
          const moved = await moveFile(token, siteId, driveId, file, folder);
          if (moved) {
            console.log(`    ✓ ${file.substring(0, 50)}...`);
          }
        }
      }
      console.log('');
    }

    console.log('═'.repeat(60));
    console.log('✅ Folder structure setup complete!');
    console.log('═'.repeat(60));
    console.log('\nYour SharePoint libraries now have organized folders.');
    console.log('You can view them at:');
    console.log(`  ${config.SITE_URL}/Specifications`);
    console.log(`  ${config.SITE_URL}/TestMethods`);

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
