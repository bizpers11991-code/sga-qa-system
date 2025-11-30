/**
 * SharePoint List Setup Script
 * Run this once to create all required SharePoint lists and document libraries
 *
 * Usage: node --loader tsx scripts/setup-sharepoint.ts
 */

import { getSharePointClient } from '../src/lib/sharepoint/connection';
import { getAccessToken, validateAuthConfig } from '../src/lib/sharepoint/auth';

interface ListSchema {
  listName: string;
  description: string;
  columns: Array<{
    name: string;
    type: 'Text' | 'Note' | 'Number' | 'DateTime' | 'Choice' | 'Lookup' | 'Person' | 'Boolean';
    required?: boolean;
    choices?: string[];
    lookupList?: string;
    lookupField?: string;
  }>;
}

const SHAREPOINT_LISTS: ListSchema[] = [
  {
    listName: 'Jobs',
    description: 'Job assignments and tracking',
    columns: [
      { name: 'JobNumber', type: 'Text', required: true },
      { name: 'JobType', type: 'Choice', required: true, choices: ['Asphalt', 'Profiling', 'Spray'] },
      { name: 'ProjectID', type: 'Text' },
      { name: 'Location', type: 'Text', required: true },
      { name: 'ScheduledDate', type: 'DateTime', required: true },
      { name: 'DueDate', type: 'DateTime', required: true },
      { name: 'AssignedForemanId', type: 'Text', required: true },
      { name: 'AssignedCrewId', type: 'Text' },
      { name: 'Status', type: 'Choice', required: true, choices: ['Pending', 'In Progress', 'Completed', 'On Hold'] },
      { name: 'WorkDescription', type: 'Note', required: true },
      { name: 'Area', type: 'Number' },
      { name: 'Thickness', type: 'Number' },
      { name: 'ClientTier', type: 'Choice', choices: ['Tier 1', 'Tier 2', 'Tier 3'] },
      { name: 'QASpec', type: 'Text' },
    ]
  },
  {
    listName: 'Projects',
    description: 'Project management and tracking',
    columns: [
      { name: 'ProjectNumber', type: 'Text', required: true },
      { name: 'HandoverID', type: 'Text', required: true },
      { name: 'ProjectName', type: 'Text', required: true },
      { name: 'Client', type: 'Text', required: true },
      { name: 'ClientTier', type: 'Choice', required: true, choices: ['Tier 1', 'Tier 2', 'Tier 3'] },
      { name: 'Location', type: 'Text', required: true },
      { name: 'ProjectOwnerId', type: 'Text', required: true },
      { name: 'ProjectOwnerDivision', type: 'Choice', required: true, choices: ['Asphalt', 'Profiling', 'Spray'] },
      { name: 'ScopingPersonId', type: 'Text', required: true },
      { name: 'Status', type: 'Choice', required: true, choices: ['Scoping', 'Scheduled', 'In Progress', 'QA Review', 'Completed', 'On Hold'] },
      { name: 'EstimatedStartDate', type: 'DateTime', required: true },
      { name: 'EstimatedEndDate', type: 'DateTime', required: true },
      { name: 'ActualStartDate', type: 'DateTime' },
      { name: 'ActualEndDate', type: 'DateTime' },
    ]
  },
  {
    listName: 'Tenders',
    description: 'Tender handovers and management',
    columns: [
      { name: 'HandoverNumber', type: 'Text', required: true },
      { name: 'ClientName', type: 'Text', required: true },
      { name: 'ClientTier', type: 'Choice', required: true, choices: ['Tier 1', 'Tier 2', 'Tier 3'] },
      { name: 'ClientId', type: 'Text', required: true },
      { name: 'ProjectName', type: 'Text', required: true },
      { name: 'ProjectDescription', type: 'Note', required: true },
      { name: 'Location', type: 'Text', required: true },
      { name: 'EstimatedStartDate', type: 'DateTime', required: true },
      { name: 'EstimatedEndDate', type: 'DateTime', required: true },
      { name: 'ProjectOwnerId', type: 'Text', required: true },
      { name: 'ScopingPersonId', type: 'Text', required: true },
      { name: 'Status', type: 'Choice', required: true, choices: ['Draft', 'Submitted', 'Accepted', 'Converted', 'Rejected'] },
      { name: 'DateCreated', type: 'DateTime', required: true },
      { name: 'CreatedBy', type: 'Text', required: true },
    ]
  },
  {
    listName: 'ScopeReports',
    description: 'Site scope reports and assessments',
    columns: [
      { name: 'ReportNumber', type: 'Text', required: true },
      { name: 'ProjectId', type: 'Text', required: true },
      { name: 'VisitNumber', type: 'Number', required: true },
      { name: 'VisitType', type: 'Choice', required: true, choices: ['14-Day', '7-Day', '3-Day', '72-Hour'] },
      { name: 'ScheduledDate', type: 'DateTime', required: true },
      { name: 'ActualDate', type: 'DateTime', required: true },
      { name: 'CompletedBy', type: 'Text', required: true },
      { name: 'Status', type: 'Choice', required: true, choices: ['Draft', 'Submitted', 'Reviewed'] },
      { name: 'Recommendations', type: 'Note', required: true },
      { name: 'EstimatedDuration', type: 'Number', required: true },
      { name: 'Signature', type: 'Text', required: true },
      { name: 'SignedAt', type: 'DateTime', required: true },
    ]
  },
  {
    listName: 'DivisionRequests',
    description: 'Cross-division work requests',
    columns: [
      { name: 'RequestNumber', type: 'Text', required: true },
      { name: 'ProjectId', type: 'Text', required: true },
      { name: 'RequestedBy', type: 'Choice', required: true, choices: ['Asphalt', 'Profiling', 'Spray'] },
      { name: 'RequestedFrom', type: 'Choice', required: true, choices: ['Asphalt', 'Profiling', 'Spray'] },
      { name: 'RequestType', type: 'Choice', required: true, choices: ['Profiling', 'Spray Seal', 'Asphalt'] },
      { name: 'Description', type: 'Note', required: true },
      { name: 'Status', type: 'Choice', required: true, choices: ['Pending', 'Accepted', 'Declined', 'Completed', 'Cancelled'] },
      { name: 'DateCreated', type: 'DateTime', required: true },
      { name: 'CreatedBy', type: 'Text', required: true },
      { name: 'ResponseDate', type: 'DateTime' },
      { name: 'ResponseBy', type: 'Text' },
      { name: 'CompletionDate', type: 'DateTime' },
    ]
  },
  {
    listName: 'QAPacks',
    description: 'Quality assurance packages and reviews',
    columns: [
      { name: 'PackNumber', type: 'Text', required: true },
      { name: 'ProjectId', type: 'Text', required: true },
      { name: 'SubmittedBy', type: 'Text', required: true },
      { name: 'SubmittedDate', type: 'DateTime', required: true },
      { name: 'Status', type: 'Choice', required: true, choices: ['Pending Review', 'Requires Action', 'Approved', 'Archived'] },
      { name: 'ReviewedBy', type: 'Text' },
      { name: 'ReviewedDate', type: 'DateTime' },
      { name: 'ApprovedBy', type: 'Text' },
      { name: 'ApprovedDate', type: 'DateTime' },
      { name: 'Comments', type: 'Note' },
    ]
  },
  {
    listName: 'Incidents',
    description: 'Safety incidents and reports',
    columns: [
      { name: 'IncidentNumber', type: 'Text', required: true },
      { name: 'IncidentType', type: 'Choice', required: true, choices: ['Near Miss', 'Minor Injury', 'Major Injury', 'Property Damage', 'Environmental'] },
      { name: 'Severity', type: 'Choice', required: true, choices: ['Low', 'Medium', 'High', 'Critical'] },
      { name: 'Location', type: 'Text', required: true },
      { name: 'IncidentDate', type: 'DateTime', required: true },
      { name: 'ReportedBy', type: 'Text', required: true },
      { name: 'ReportedDate', type: 'DateTime', required: true },
      { name: 'Description', type: 'Note', required: true },
      { name: 'Status', type: 'Choice', required: true, choices: ['Reported', 'Under Investigation', 'Resolved', 'Closed'] },
      { name: 'InvestigatedBy', type: 'Text' },
      { name: 'ClosedBy', type: 'Text' },
      { name: 'ClosedDate', type: 'DateTime' },
    ]
  }
];

const DOCUMENT_LIBRARIES = [
  {
    name: 'Documents',
    description: 'General project documents'
  },
  {
    name: 'QADocuments',
    description: 'Quality assurance documentation'
  },
  {
    name: 'Photos',
    description: 'Site photos and images'
  },
  {
    name: 'ScopeReportDocuments',
    description: 'Scope report attachments'
  }
];

async function createList(client: any, schema: ListSchema): Promise<void> {
  console.log(`Creating list: ${schema.listName}...`);

  try {
    // Create list
    const endpoint = '/_api/web/lists';
    const listData = {
      __metadata: { type: 'SP.List' },
      AllowContentTypes: true,
      BaseTemplate: 100, // Generic List
      ContentTypesEnabled: true,
      Description: schema.description,
      Title: schema.listName,
    };

    await client.post(endpoint, listData);
    console.log(`✓ Created list: ${schema.listName}`);

    // Add columns
    for (const column of schema.columns) {
      if (column.name === 'Title') continue; // Title field exists by default

      try {
        await createColumn(client, schema.listName, column);
        console.log(`  ✓ Added column: ${column.name}`);
      } catch (error: any) {
        if (error.statusCode === 409) {
          console.log(`  - Column already exists: ${column.name}`);
        } else {
          console.error(`  ✗ Failed to add column ${column.name}:`, error.message);
        }
      }
    }

  } catch (error: any) {
    if (error.statusCode === 409) {
      console.log(`- List already exists: ${schema.listName}`);
    } else {
      throw error;
    }
  }
}

async function createColumn(client: any, listName: string, column: any): Promise<void> {
  const endpoint = `/_api/web/lists/getbytitle('${listName}')/fields`;

  let fieldData: any = {
    __metadata: { type: 'SP.Field' },
    Title: column.name,
    FieldTypeKind: getFieldTypeKind(column.type),
    Required: column.required || false,
  };

  if (column.type === 'Choice' && column.choices) {
    fieldData = {
      __metadata: { type: 'SP.FieldChoice' },
      Title: column.name,
      FieldTypeKind: 6, // Choice
      Required: column.required || false,
      Choices: { results: column.choices },
    };
  }

  await client.post(endpoint, fieldData);
}

function getFieldTypeKind(type: string): number {
  const typeMap: Record<string, number> = {
    'Text': 2,
    'Note': 3,
    'Number': 9,
    'DateTime': 4,
    'Choice': 6,
    'Lookup': 7,
    'Boolean': 8,
    'Person': 20,
  };
  return typeMap[type] || 2;
}

async function createDocumentLibrary(client: any, name: string, description: string): Promise<void> {
  console.log(`Creating document library: ${name}...`);

  try {
    const endpoint = '/_api/web/lists';
    const libraryData = {
      __metadata: { type: 'SP.List' },
      AllowContentTypes: true,
      BaseTemplate: 101, // Document Library
      ContentTypesEnabled: true,
      Description: description,
      Title: name,
    };

    await client.post(endpoint, libraryData);
    console.log(`✓ Created document library: ${name}`);

  } catch (error: any) {
    if (error.statusCode === 409) {
      console.log(`- Document library already exists: ${name}`);
    } else {
      throw error;
    }
  }
}

async function main() {
  console.log('🚀 SharePoint Setup Script\n');
  console.log('='.repeat(60));

  // Validate auth configuration
  console.log('\n1. Validating Azure AD configuration...');
  const { valid, error } = await validateAuthConfig();

  if (!valid) {
    console.error('❌ Authentication configuration invalid!');
    console.error('Error:', error);
    console.log('\nPlease set the following environment variables:');
    console.log('  - AZURE_CLIENT_ID');
    console.log('  - AZURE_CLIENT_SECRET');
    console.log('  - AZURE_TENANT_ID');
    console.log('  - SHAREPOINT_SITE_URL');
    process.exit(1);
  }

  console.log('✓ Authentication configuration valid');

  // Get access token
  console.log('\n2. Acquiring access token...');
  const token = await getAccessToken();
  console.log('✓ Access token acquired');

  // Get SharePoint client
  const client = getSharePointClient();

  // Create lists
  console.log('\n3. Creating SharePoint lists...');
  console.log('-'.repeat(60));

  for (const schema of SHAREPOINT_LISTS) {
    await createList(client, schema);
  }

  // Create document libraries
  console.log('\n4. Creating document libraries...');
  console.log('-'.repeat(60));

  for (const library of DOCUMENT_LIBRARIES) {
    await createDocumentLibrary(client, library.name, library.description);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ SharePoint setup complete!');
  console.log('\nCreated:');
  console.log(`  - ${SHAREPOINT_LISTS.length} lists`);
  console.log(`  - ${DOCUMENT_LIBRARIES.length} document libraries`);
  console.log('\nNext steps:');
  console.log('  1. Verify lists in SharePoint');
  console.log('  2. Run migration scripts to populate data');
  console.log('  3. Test API endpoints');
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Setup failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  });
}

export { main as setupSharePoint };
