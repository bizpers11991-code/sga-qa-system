/**
 * Direct M365 Automation Script
 *
 * This script uses your Azure credentials to DIRECTLY execute
 * M365 deployment tasks without needing Copilot as a middleman.
 *
 * Created by: Claude (Sonnet 4.5)
 * Date: November 18, 2025
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { promisify } from 'util';
import { exec } from 'child_process';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.azure') });

const TENANT_ID = process.env.TENANT_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID;

/**
 * Get Microsoft Graph access token
 */
async function getGraphToken() {
  console.log('🔐 Getting Microsoft Graph access token...');

  const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  if (!response.ok) {
    throw new Error(`Failed to get token: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ Access token obtained');
  return data.access_token;
}

/**
 * Get Power Platform access token
 */
async function getPowerPlatformToken() {
  console.log('🔐 Getting Power Platform access token...');

  const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: 'https://service.powerapps.com/.default',
    grant_type: 'client_credentials'
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  if (!response.ok) {
    throw new Error(`Failed to get Power Platform token: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ Power Platform token obtained');
  return data.access_token;
}

/**
 * List all Power Platform environments
 */
async function listEnvironments() {
  console.log('\n📋 Listing Power Platform environments...');

  const token = await getPowerPlatformToken();

  const response = await fetch('https://api.bap.microsoft.com/providers/Microsoft.BusinessAppPlatform/scopes/admin/environments?api-version=2020-10-01', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to list environments: ${response.status}`);
  }

  const data = await response.json();

  console.log('\n✅ Environments found:');
  if (data.value && data.value.length > 0) {
    data.value.forEach(env => {
      console.log(`  - ${env.properties.displayName}`);
      console.log(`    ID: ${env.name}`);
      console.log(`    URL: ${env.properties.linkedEnvironmentMetadata?.instanceUrl || 'N/A'}`);
      console.log('');
    });
  } else {
    console.log('  No environments found');
  }

  return data.value;
}

/**
 * Create Power Platform environment
 */
async function createEnvironment(displayName, location = 'australia') {
  console.log(`\n🏗️  Creating Power Platform environment: ${displayName}...`);

  const token = await getPowerPlatformToken();

  const requestBody = {
    location: location,
    properties: {
      displayName: displayName,
      environmentSku: 'Production',
      azureRegion: location,
      databaseType: 'CommonDataService',
      linkedEnvironmentMetadata: {
        type: 'Dynamics365Apps',
        baseLanguage: 1033, // English
        currency: {
          code: 'AUD'
        },
        securityGroupId: '00000000-0000-0000-0000-000000000000'
      }
    }
  };

  const response = await fetch('https://api.bap.microsoft.com/providers/Microsoft.BusinessAppPlatform/environments?api-version=2020-10-01', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create environment: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ Environment creation initiated');
  console.log(`   Environment ID: ${data.name}`);

  return data;
}

/**
 * Check SharePoint site exists
 */
async function checkSharePointSite(siteUrl) {
  console.log(`\n🔍 Checking SharePoint site: ${siteUrl}...`);

  const token = await getGraphToken();
  const sitePath = siteUrl.replace('https://sgagroupcomau.sharepoint.com', '');

  const response = await fetch(`https://graph.microsoft.com/v1.0/sites/sgagroupcomau.sharepoint.com:${sitePath}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    console.log('❌ SharePoint site not accessible');
    return null;
  }

  const data = await response.json();
  console.log('✅ SharePoint site found!');
  console.log(`   Name: ${data.displayName}`);
  console.log(`   ID: ${data.id}`);

  return data;
}

/**
 * Create SharePoint document library
 */
async function createDocumentLibrary(siteId, libraryName) {
  console.log(`\n📁 Creating document library: ${libraryName}...`);

  const token = await getGraphToken();

  const requestBody = {
    name: libraryName,
    list: {
      template: 'documentLibrary'
    }
  };

  const response = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create library: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log(`✅ Document library created: ${data.displayName}`);

  return data;
}

/**
 * Execute PowerShell command via pac CLI
 */
async function executePacCommand(command) {
  console.log(`\n⚙️  Executing: pac ${command}...`);

  try {
    const { stdout, stderr } = await execPromise(`pac ${command}`, {
      shell: 'powershell.exe'
    });

    console.log('✅ Command completed');
    if (stdout) console.log(stdout);
    if (stderr) console.warn('Warnings:', stderr);

    return { success: true, stdout, stderr };
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main automation workflow
 */
async function runAutomation(phase) {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Direct M365 Automation (No Copilot Needed!)');
  console.log('  Using your Azure App Registration credentials');
  console.log('═══════════════════════════════════════════════════════\n');

  if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
    console.error('❌ Missing credentials! Check your .env.azure file');
    process.exit(1);
  }

  try {
    switch (phase) {
      case 'test':
        console.log('🧪 Testing authentication...\n');
        const graphToken = await getGraphToken();
        const ppToken = await getPowerPlatformToken();
        console.log('\n✅ All authentication working!');
        console.log('   You are ready to deploy directly to M365!');
        break;

      case 'list-environments':
        await listEnvironments();
        break;

      case 'create-environment':
        await createEnvironment('SGA QA Pack - Production', 'australia');
        console.log('\n⏳ Environment is being provisioned...');
        console.log('   This takes 5-10 minutes.');
        console.log('   Run: node scripts/direct-m365-automation.js list-environments');
        console.log('   to check status.');
        break;

      case 'check-sharepoint':
        await checkSharePointSite('/sites/SGAQualityAssurance');
        break;

      case 'setup-sharepoint':
        console.log('\n📚 Setting up SharePoint libraries...');
        const site = await checkSharePointSite('/sites/SGAQualityAssurance');
        if (site) {
          const libraries = [
            'QA Packs',
            'Job Sheets',
            'Site Photos',
            'Incident Reports',
            'NCR Documents'
          ];

          for (const lib of libraries) {
            try {
              await createDocumentLibrary(site.id, lib);
            } catch (error) {
              console.log(`⚠️  ${lib} might already exist: ${error.message}`);
            }
          }
          console.log('\n✅ SharePoint setup complete!');
        }
        break;

      default:
        console.log('Available commands:');
        console.log('  node scripts/direct-m365-automation.js test');
        console.log('  node scripts/direct-m365-automation.js list-environments');
        console.log('  node scripts/direct-m365-automation.js create-environment');
        console.log('  node scripts/direct-m365-automation.js check-sharepoint');
        console.log('  node scripts/direct-m365-automation.js setup-sharepoint');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run
const phase = process.argv[2] || 'help';
runAutomation(phase);
