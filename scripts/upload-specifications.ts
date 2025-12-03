/**
 * Upload Specifications and Test Methods to SharePoint
 *
 * Uploads all PDFs from docs/Specifications and Test Methods
 * to SharePoint document libraries
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });

const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

// Configuration
const config = {
  SITE_URL: process.env.SHAREPOINT_SITE_URL!,
  CLIENT_ID: process.env.AZURE_CLIENT_ID!,
  CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET!,
  TENANT_ID: process.env.AZURE_TENANT_ID!,
};

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
    throw new Error('Failed to get Graph token: ' + JSON.stringify(data));
  }
  return data.access_token;
}

// Get site ID
async function getSiteId(token: string): Promise<string> {
  const url = new URL(config.SITE_URL);
  const graphUrl = `${GRAPH_API_BASE}/sites/${url.hostname}:${url.pathname}`;

  const response = await fetch(graphUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  if (!data.id) {
    throw new Error('Failed to get site ID: ' + JSON.stringify(data));
  }
  return data.id;
}

// Get drive ID for a document library (or create it)
async function getOrCreateDrive(token: string, siteId: string, libraryName: string): Promise<string> {
  // First check if library exists
  const listUrl = `${GRAPH_API_BASE}/sites/${siteId}/lists?$filter=displayName eq '${libraryName}'`;
  const listResponse = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (listResponse.ok) {
    const listData = await listResponse.json();
    if (listData.value && listData.value.length > 0) {
      // Get drive for this list
      const driveUrl = `${GRAPH_API_BASE}/sites/${siteId}/lists/${listData.value[0].id}/drive`;
      const driveResponse = await fetch(driveUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (driveResponse.ok) {
        const driveData = await driveResponse.json();
        return driveData.id;
      }
    }
  }

  // Create the document library
  console.log(`  Creating document library: ${libraryName}...`);
  const createUrl = `${GRAPH_API_BASE}/sites/${siteId}/lists`;
  const createResponse = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      displayName: libraryName,
      list: {
        template: 'documentLibrary',
      },
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Failed to create library ${libraryName}: ${error}`);
  }

  const createData = await createResponse.json();

  // Get drive for the new list
  const driveUrl = `${GRAPH_API_BASE}/sites/${siteId}/lists/${createData.id}/drive`;
  const driveResponse = await fetch(driveUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!driveResponse.ok) {
    throw new Error('Failed to get drive for new library');
  }

  const driveData = await driveResponse.json();
  return driveData.id;
}

// Upload a file to SharePoint
async function uploadFile(
  token: string,
  siteId: string,
  driveId: string,
  filePath: string,
  targetPath: string
): Promise<{ success: boolean; webUrl?: string; error?: string }> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const uploadUrl = `${GRAPH_API_BASE}/sites/${siteId}/drives/${driveId}/root:/${targetPath}:/content`;

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/pdf',
      },
      body: fileBuffer,
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `${response.status}: ${error}` };
    }

    const data = await response.json();
    return { success: true, webUrl: data.webUrl };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Main upload function
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Upload Specifications & Test Methods to SharePoint       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Check configuration
  if (!config.SITE_URL || !config.CLIENT_ID || !config.CLIENT_SECRET || !config.TENANT_ID) {
    console.error('❌ Missing required environment variables');
    console.log('Required: SHAREPOINT_SITE_URL, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID');
    process.exit(1);
  }

  const docsRoot = path.resolve(__dirname, '..', 'docs', 'Specifications and Test Methods');

  if (!fs.existsSync(docsRoot)) {
    console.error('❌ Docs folder not found:', docsRoot);
    process.exit(1);
  }

  try {
    // Get tokens and site ID
    console.log('🔑 Authenticating with Microsoft Graph...');
    const token = await getGraphToken();
    console.log('  ✓ Token acquired');

    const siteId = await getSiteId(token);
    console.log('  ✓ Site ID:', siteId.substring(0, 50) + '...');

    // Get or create the Specifications library
    console.log('\n📁 Setting up "Specifications" document library...');
    const specsDriveId = await getOrCreateDrive(token, siteId, 'Specifications');
    console.log('  ✓ Specifications library ready');

    // Get or create the TestMethods library
    console.log('\n📁 Setting up "TestMethods" document library...');
    const testMethodsDriveId = await getOrCreateDrive(token, siteId, 'TestMethods');
    console.log('  ✓ TestMethods library ready');

    // Upload Specifications
    const specsFolder = path.join(docsRoot, 'Specifications');
    if (fs.existsSync(specsFolder)) {
      console.log('\n📤 Uploading Specifications...');
      const specFiles = fs.readdirSync(specsFolder).filter(f => f.endsWith('.pdf'));

      let successCount = 0;
      for (const file of specFiles) {
        const filePath = path.join(specsFolder, file);
        const result = await uploadFile(token, siteId, specsDriveId, filePath, file);

        if (result.success) {
          console.log(`  ✓ ${file}`);
          successCount++;
        } else {
          console.log(`  ✗ ${file}: ${result.error}`);
        }
      }
      console.log(`  Uploaded ${successCount}/${specFiles.length} specification files`);
    }

    // Upload Test Methods
    const testMethodsFolder = path.join(docsRoot, 'Test Methods');
    if (fs.existsSync(testMethodsFolder)) {
      console.log('\n📤 Uploading Test Methods...');
      const testFiles = fs.readdirSync(testMethodsFolder).filter(f => f.endsWith('.pdf'));

      let successCount = 0;
      for (const file of testFiles) {
        const filePath = path.join(testMethodsFolder, file);
        const result = await uploadFile(token, siteId, testMethodsDriveId, filePath, file);

        if (result.success) {
          console.log(`  ✓ ${file}`);
          successCount++;
        } else {
          console.log(`  ✗ ${file}: ${result.error}`);
        }
      }
      console.log(`  Uploaded ${successCount}/${testFiles.length} test method files`);
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Upload complete!');
    console.log('═'.repeat(60));
    console.log('\nYour documents are now available at:');
    console.log(`  Specifications: ${config.SITE_URL}/Specifications`);
    console.log(`  Test Methods: ${config.SITE_URL}/TestMethods`);

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
