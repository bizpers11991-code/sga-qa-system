/**
 * SGA QA System - Migrate Foremen to CrewMembers
 *
 * Migrates existing Foremen list data to the new unified CrewMembers list.
 * After migration, the Foremen list can be deprecated.
 *
 * Usage: npx tsx scripts/migrate-foremen-to-crewmembers.ts
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

async function getForemenList(token: string, siteId: string): Promise<any[]> {
  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/Foremen/items?$expand=fields&$top=500`;

  const response = await fetch(graphUrl, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.text();
    console.log('Foremen list response:', error);
    return [];
  }

  const data = await response.json();
  return data.value || [];
}

async function getCrewMembersList(token: string, siteId: string): Promise<any[]> {
  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/CrewMembers/items?$expand=fields&$top=500`;

  const response = await fetch(graphUrl, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.value || [];
}

async function createCrewMember(token: string, siteId: string, data: any): Promise<boolean> {
  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/CrewMembers/items`;

  const response = await fetch(graphUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: data }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Failed to create crew member: ${error}`);
    return false;
  }

  return true;
}

function mapRoleToCrewRole(systemRole: string): string {
  if (systemRole?.includes('foreman')) return 'Foreman';
  if (systemRole?.includes('engineer')) return 'Engineer';
  if (systemRole?.includes('manager') || systemRole?.includes('admin')) return 'Manager';
  return 'Operator';
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     SGA QA System - Migrate Foremen to CrewMembers             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const { SITE_URL, CLIENT_ID, CLIENT_SECRET, TENANT_ID } = getConfig();

  if (!SITE_URL || !CLIENT_ID || !CLIENT_SECRET || !TENANT_ID) {
    console.error('❌ Missing required environment variables!');
    process.exit(1);
  }

  try {
    // Get access token
    console.log('1. Acquiring access token...');
    const token = await getAccessToken();
    console.log('   ✓ Access token acquired\n');

    // Get site ID
    console.log('2. Getting SharePoint site ID...');
    const siteId = await getSiteId(token);
    console.log('   ✓ Site ID acquired\n');

    // Get existing Foremen
    console.log('3. Fetching existing Foremen list...');
    const foremen = await getForemenList(token, siteId);
    console.log(`   Found ${foremen.length} foremen\n`);

    if (foremen.length === 0) {
      console.log('   No foremen to migrate. Exiting.');
      return;
    }

    // Get existing CrewMembers to check for duplicates
    console.log('4. Fetching existing CrewMembers list...');
    const existingCrew = await getCrewMembersList(token, siteId);
    const existingEmails = new Set(existingCrew.map((c: any) => c.fields?.Email?.toLowerCase()));
    console.log(`   Found ${existingCrew.length} existing crew members\n`);

    // Migrate foremen
    console.log('5. Migrating Foremen to CrewMembers...');
    console.log('─'.repeat(60));

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (const foreman of foremen) {
      const f = foreman.fields;
      const email = f.Email?.toLowerCase();

      // Skip if already exists
      if (email && existingEmails.has(email)) {
        console.log(`   - Skipping ${f.Name} (already in CrewMembers)`);
        skipped++;
        continue;
      }

      // Map foreman data to CrewMember format
      const crewMemberData = {
        Title: f.Title || f.Name,
        EmployeeId: f.Title || `EMP-${Date.now()}`,
        FullName: f.Name || f.Title,
        Email: f.Email || '',
        Phone: f.Phone || '',
        Division: f.Division || 'Common',
        SecondaryDivisions: '[]',
        Role: mapRoleToCrewRole(f.Role),
        SystemRole: f.Role || '',
        CrewName: f.CrewName || '',
        IsForeman: f.Role?.toLowerCase().includes('foreman') || false,
        IsActive: f.IsActive ?? true,
        StartDate: new Date().toISOString(),
        Certifications: '[]',
        EquipmentQualifications: '[]',
        SpecialSkills: '',
        ProficiencyLevel: 'Competent',
        Notes: `Migrated from Foremen list on ${new Date().toISOString()}`,
      };

      const success = await createCrewMember(token, siteId, crewMemberData);

      if (success) {
        console.log(`   ✓ Migrated: ${f.Name} (${f.Role || 'No role'})`);
        migrated++;
        if (email) existingEmails.add(email);
      } else {
        console.log(`   ✗ Failed: ${f.Name}`);
        failed++;
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, 100));
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('✅ Migration Complete!\n');
    console.log('Summary:');
    console.log(`  • Migrated: ${migrated}`);
    console.log(`  • Skipped (already exists): ${skipped}`);
    console.log(`  • Failed: ${failed}`);
    console.log(`  • Total processed: ${foremen.length}`);

    if (migrated > 0) {
      console.log('\n⚠️  Next Steps:');
      console.log('  1. Verify data in CrewMembers list');
      console.log('  2. Update code to use CrewMembersData');
      console.log('  3. After verification, delete old Foremen list');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
