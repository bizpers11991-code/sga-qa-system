/**
 * SGA QA System - SharePoint Setup Script
 *
 * This script creates and configures all SharePoint lists required for the
 * SGA Quality Assurance System. It handles existing lists gracefully.
 *
 * Lists Created:
 * - Jobs: Daily job assignments and tracking
 * - Projects: Multi-job project management
 * - Tenders: Tender handovers from clients
 * - Foremen: Foreman/crew lead directory
 * - QAPacks: QA pack submissions and reviews
 * - Incidents: Safety incident reports
 * - NCRs: Non-conformance reports
 * - ScopeReports: Site scope assessments
 * - DivisionRequests: Cross-division work requests
 * - ITPTemplates: Inspection & Test Plan templates
 * - SamplingPlans: Statistical sampling plans
 * - Drafts: Autosave and chat conversations
 * - Notifications: System notifications
 * - Resources: Crew and equipment tracking
 *
 * Usage: npx tsx scripts/setup-sharepoint.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current file and load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');
console.log('Loading .env from:', envPath);
const result = dotenv.config({ path: envPath, override: true });
if (result.error) {
  console.error('dotenv error:', result.error);
} else {
  console.log('dotenv loaded variables:', Object.keys(result.parsed || {}));
  // Verify specific variables are in process.env
  console.log('AZURE_CLIENT_ID in env:', !!process.env.AZURE_CLIENT_ID);
  console.log('AZURE_TENANT_ID in env:', !!process.env.AZURE_TENANT_ID);
}

// SharePoint REST API configuration - loaded after dotenv
const getConfig = () => ({
  SITE_URL: process.env.SHAREPOINT_SITE_URL,
  CLIENT_ID: process.env.AZURE_CLIENT_ID,
  CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET,
  TENANT_ID: process.env.AZURE_TENANT_ID,
});

interface ListColumn {
  name: string;
  displayName: string;
  type: 'Text' | 'Note' | 'Number' | 'DateTime' | 'Choice' | 'Boolean' | 'Currency';
  required?: boolean;
  choices?: string[];
  description?: string;
}

interface ListDefinition {
  name: string;
  description: string;
  columns: ListColumn[];
}

// SGA QA System List Definitions
const SGA_LISTS: ListDefinition[] = [
  {
    name: 'Jobs',
    description: 'Daily job assignments for asphalt, profiling, and spray divisions',
    columns: [
      { name: 'JobNumber', displayName: 'Job Number', type: 'Text', required: true },
      { name: 'JobType', displayName: 'Job Type', type: 'Choice', required: true, choices: ['Asphalt Laying', 'Profiling', 'Spray Seal', 'Line Marking', 'Patching'] },
      { name: 'Division', displayName: 'Division', type: 'Choice', required: true, choices: ['Asphalt', 'Profiling', 'Spray'] },
      { name: 'ProjectId', displayName: 'Project ID', type: 'Text' },
      { name: 'Location', displayName: 'Location', type: 'Text', required: true },
      { name: 'Client', displayName: 'Client', type: 'Text', required: true },
      { name: 'ClientTier', displayName: 'Client Tier', type: 'Choice', choices: ['Tier 1', 'Tier 2', 'Tier 3'] },
      { name: 'ScheduledDate', displayName: 'Scheduled Date', type: 'DateTime', required: true },
      { name: 'DueDate', displayName: 'Due Date', type: 'DateTime', required: true },
      { name: 'ForemanId', displayName: 'Foreman ID', type: 'Text', required: true },
      { name: 'ForemanName', displayName: 'Foreman Name', type: 'Text', required: true },
      { name: 'CrewId', displayName: 'Crew ID', type: 'Text' },
      { name: 'Status', displayName: 'Status', type: 'Choice', required: true, choices: ['Pending', 'In Progress', 'Completed', 'On Hold', 'Cancelled'] },
      { name: 'WorkDescription', displayName: 'Work Description', type: 'Note', required: true },
      { name: 'Area', displayName: 'Area (m²)', type: 'Number' },
      { name: 'Thickness', displayName: 'Thickness (mm)', type: 'Number' },
      { name: 'AsphaltMix', displayName: 'Asphalt Mix', type: 'Choice', choices: ['AC10', 'AC14', 'AC20', 'DG10', 'DG14', 'DG20', 'SMA', 'OGA'] },
      { name: 'SpecificationRef', displayName: 'Specification Reference', type: 'Text' },
      { name: 'Notes', displayName: 'Notes', type: 'Note' },
    ]
  },
  {
    name: 'Projects',
    description: 'Multi-job project management and tracking',
    columns: [
      { name: 'ProjectNumber', displayName: 'Project Number', type: 'Text', required: true },
      { name: 'ProjectName', displayName: 'Project Name', type: 'Text', required: true },
      { name: 'TenderId', displayName: 'Tender ID', type: 'Text' },
      { name: 'Client', displayName: 'Client', type: 'Text', required: true },
      { name: 'ClientTier', displayName: 'Client Tier', type: 'Choice', required: true, choices: ['Tier 1', 'Tier 2', 'Tier 3'] },
      { name: 'Location', displayName: 'Location', type: 'Text', required: true },
      { name: 'Division', displayName: 'Primary Division', type: 'Choice', required: true, choices: ['Asphalt', 'Profiling', 'Spray'] },
      { name: 'ProjectOwnerId', displayName: 'Project Owner ID', type: 'Text', required: true },
      { name: 'ProjectOwnerName', displayName: 'Project Owner Name', type: 'Text', required: true },
      { name: 'ScopingPersonId', displayName: 'Scoping Person ID', type: 'Text' },
      { name: 'Status', displayName: 'Status', type: 'Choice', required: true, choices: ['Scoping', 'Scheduled', 'In Progress', 'QA Review', 'Completed', 'On Hold'] },
      { name: 'EstimatedStartDate', displayName: 'Estimated Start', type: 'DateTime', required: true },
      { name: 'EstimatedEndDate', displayName: 'Estimated End', type: 'DateTime', required: true },
      { name: 'ActualStartDate', displayName: 'Actual Start', type: 'DateTime' },
      { name: 'ActualEndDate', displayName: 'Actual End', type: 'DateTime' },
      { name: 'TotalArea', displayName: 'Total Area (m²)', type: 'Number' },
      { name: 'ContractValue', displayName: 'Contract Value', type: 'Currency' },
      { name: 'Notes', displayName: 'Notes', type: 'Note' },
    ]
  },
  {
    name: 'Tenders',
    description: 'Tender handovers from sales/admin to project teams',
    columns: [
      { name: 'HandoverNumber', displayName: 'Handover Number', type: 'Text', required: true },
      { name: 'ClientName', displayName: 'Client Name', type: 'Text', required: true },
      { name: 'ClientTier', displayName: 'Client Tier', type: 'Choice', required: true, choices: ['Tier 1', 'Tier 2', 'Tier 3'] },
      { name: 'ProjectName', displayName: 'Project Name', type: 'Text', required: true },
      { name: 'ProjectDescription', displayName: 'Project Description', type: 'Note', required: true },
      { name: 'Location', displayName: 'Location', type: 'Text', required: true },
      { name: 'Division', displayName: 'Division', type: 'Choice', required: true, choices: ['Asphalt', 'Profiling', 'Spray'] },
      { name: 'EstimatedStartDate', displayName: 'Estimated Start', type: 'DateTime', required: true },
      { name: 'EstimatedEndDate', displayName: 'Estimated End', type: 'DateTime', required: true },
      { name: 'ContractValue', displayName: 'Contract Value', type: 'Currency' },
      { name: 'ProjectOwnerId', displayName: 'Project Owner ID', type: 'Text' },
      { name: 'Status', displayName: 'Status', type: 'Choice', required: true, choices: ['Draft', 'Submitted', 'Accepted', 'Converted to Project', 'Rejected'] },
      { name: 'CreatedBy', displayName: 'Created By', type: 'Text', required: true },
      { name: 'DateCreated', displayName: 'Date Created', type: 'DateTime', required: true },
      { name: 'Notes', displayName: 'Notes', type: 'Note' },
    ]
  },
  {
    name: 'Foremen',
    description: 'Foreman and crew lead directory with roles',
    columns: [
      { name: 'Name', displayName: 'Full Name', type: 'Text', required: true },
      { name: 'Email', displayName: 'Email', type: 'Text', required: true },
      { name: 'Phone', displayName: 'Phone', type: 'Text' },
      { name: 'Division', displayName: 'Division', type: 'Choice', required: true, choices: ['Asphalt', 'Profiling', 'Spray'] },
      { name: 'Role', displayName: 'Role', type: 'Choice', required: true, choices: ['asphalt_foreman', 'profiling_foreman', 'spray_foreman', 'asphalt_engineer', 'profiling_engineer', 'spray_admin', 'scheduler_admin', 'tender_admin', 'management_admin', 'hseq_manager'] },
      { name: 'CrewName', displayName: 'Crew Name', type: 'Text' },
      { name: 'IsActive', displayName: 'Is Active', type: 'Boolean' },
    ]
  },
  {
    name: 'QAPacks',
    description: 'Quality Assurance pack submissions and reviews',
    columns: [
      { name: 'PackNumber', displayName: 'Pack Number', type: 'Text', required: true },
      { name: 'JobId', displayName: 'Job ID', type: 'Text', required: true },
      { name: 'ProjectId', displayName: 'Project ID', type: 'Text' },
      { name: 'Division', displayName: 'Division', type: 'Choice', required: true, choices: ['Asphalt', 'Profiling', 'Spray'] },
      { name: 'SubmittedBy', displayName: 'Submitted By', type: 'Text', required: true },
      { name: 'SubmittedDate', displayName: 'Submitted Date', type: 'DateTime', required: true },
      { name: 'Status', displayName: 'Status', type: 'Choice', required: true, choices: ['Pending Review', 'Requires Action', 'Approved', 'Archived'] },
      { name: 'ReviewedBy', displayName: 'Reviewed By', type: 'Text' },
      { name: 'ReviewedDate', displayName: 'Reviewed Date', type: 'DateTime' },
      { name: 'PackData', displayName: 'Pack Data (JSON)', type: 'Note' },
      { name: 'AISummary', displayName: 'AI Summary', type: 'Note' },
      { name: 'PdfUrl', displayName: 'PDF URL', type: 'Text' },
      { name: 'Comments', displayName: 'Comments', type: 'Note' },
    ]
  },
  {
    name: 'Incidents',
    description: 'Safety incident reports and investigations',
    columns: [
      { name: 'IncidentNumber', displayName: 'Incident Number', type: 'Text', required: true },
      { name: 'IncidentType', displayName: 'Incident Type', type: 'Choice', required: true, choices: ['Near Miss', 'First Aid', 'Medical Treatment', 'Lost Time Injury', 'Property Damage', 'Environmental', 'Vehicle Incident'] },
      { name: 'Severity', displayName: 'Severity', type: 'Choice', required: true, choices: ['Low', 'Medium', 'High', 'Critical'] },
      { name: 'JobId', displayName: 'Job ID', type: 'Text' },
      { name: 'Location', displayName: 'Location', type: 'Text', required: true },
      { name: 'DateOfIncident', displayName: 'Date of Incident', type: 'DateTime', required: true },
      { name: 'TimeOfIncident', displayName: 'Time of Incident', type: 'Text' },
      { name: 'ReporterId', displayName: 'Reporter ID', type: 'Text', required: true },
      { name: 'ReporterName', displayName: 'Reporter Name', type: 'Text', required: true },
      { name: 'Description', displayName: 'Description', type: 'Note', required: true },
      { name: 'ImmediateActions', displayName: 'Immediate Actions', type: 'Note' },
      { name: 'Status', displayName: 'Status', type: 'Choice', required: true, choices: ['Reported', 'Under Investigation', 'Corrective Actions', 'Closed'] },
      { name: 'InvestigatedBy', displayName: 'Investigated By', type: 'Text' },
      { name: 'RootCause', displayName: 'Root Cause', type: 'Note' },
      { name: 'CorrectiveActions', displayName: 'Corrective Actions', type: 'Note' },
      { name: 'ClosedDate', displayName: 'Closed Date', type: 'DateTime' },
    ]
  },
  {
    name: 'NCRs',
    description: 'Non-Conformance Reports for quality issues',
    columns: [
      { name: 'NCRNumber', displayName: 'NCR Number', type: 'Text', required: true },
      { name: 'JobId', displayName: 'Job ID', type: 'Text' },
      { name: 'ProjectId', displayName: 'Project ID', type: 'Text' },
      { name: 'NCRType', displayName: 'NCR Type', type: 'Choice', required: true, choices: ['Material', 'Workmanship', 'Testing', 'Documentation', 'Equipment'] },
      { name: 'Severity', displayName: 'Severity', type: 'Choice', required: true, choices: ['Minor', 'Major', 'Critical'] },
      { name: 'Description', displayName: 'Description', type: 'Note', required: true },
      { name: 'Location', displayName: 'Location', type: 'Text' },
      { name: 'RaisedBy', displayName: 'Raised By', type: 'Text', required: true },
      { name: 'RaisedDate', displayName: 'Raised Date', type: 'DateTime', required: true },
      { name: 'Status', displayName: 'Status', type: 'Choice', required: true, choices: ['Open', 'Under Review', 'Corrective Action', 'Verification', 'Closed'] },
      { name: 'RootCause', displayName: 'Root Cause', type: 'Note' },
      { name: 'CorrectiveAction', displayName: 'Corrective Action', type: 'Note' },
      { name: 'VerifiedBy', displayName: 'Verified By', type: 'Text' },
      { name: 'ClosedDate', displayName: 'Closed Date', type: 'DateTime' },
    ]
  },
  {
    name: 'ScopeReports',
    description: 'Site scope assessment reports',
    columns: [
      { name: 'ReportNumber', displayName: 'Report Number', type: 'Text', required: true },
      { name: 'ProjectId', displayName: 'Project ID', type: 'Text', required: true },
      { name: 'VisitNumber', displayName: 'Visit Number', type: 'Number', required: true },
      { name: 'VisitType', displayName: 'Visit Type', type: 'Choice', required: true, choices: ['14-Day', '7-Day', '3-Day', '72-Hour', 'Pre-Start', 'Final'] },
      { name: 'ScheduledDate', displayName: 'Scheduled Date', type: 'DateTime', required: true },
      { name: 'ActualDate', displayName: 'Actual Date', type: 'DateTime' },
      { name: 'CompletedBy', displayName: 'Completed By', type: 'Text', required: true },
      { name: 'Status', displayName: 'Status', type: 'Choice', required: true, choices: ['Scheduled', 'In Progress', 'Draft', 'Submitted', 'Reviewed'] },
      { name: 'SiteConditions', displayName: 'Site Conditions', type: 'Note' },
      { name: 'TrafficManagement', displayName: 'Traffic Management', type: 'Note' },
      { name: 'AccessIssues', displayName: 'Access Issues', type: 'Note' },
      { name: 'Recommendations', displayName: 'Recommendations', type: 'Note' },
      { name: 'EstimatedDuration', displayName: 'Estimated Duration (hours)', type: 'Number' },
      { name: 'ReportData', displayName: 'Report Data (JSON)', type: 'Note' },
    ]
  },
  {
    name: 'DivisionRequests',
    description: 'Cross-division work requests (e.g., Asphalt requesting Profiling)',
    columns: [
      { name: 'RequestNumber', displayName: 'Request Number', type: 'Text', required: true },
      { name: 'ProjectId', displayName: 'Project ID', type: 'Text', required: true },
      { name: 'RequestingDivision', displayName: 'Requesting Division', type: 'Choice', required: true, choices: ['Asphalt', 'Profiling', 'Spray'] },
      { name: 'TargetDivision', displayName: 'Target Division', type: 'Choice', required: true, choices: ['Asphalt', 'Profiling', 'Spray'] },
      { name: 'RequestType', displayName: 'Request Type', type: 'Choice', required: true, choices: ['Profiling Support', 'Spray Seal Support', 'Asphalt Support', 'Equipment', 'Personnel'] },
      { name: 'Description', displayName: 'Description', type: 'Note', required: true },
      { name: 'RequiredDate', displayName: 'Required Date', type: 'DateTime', required: true },
      { name: 'Status', displayName: 'Status', type: 'Choice', required: true, choices: ['Pending', 'Accepted', 'Declined', 'Scheduled', 'Completed', 'Cancelled'] },
      { name: 'RequestedBy', displayName: 'Requested By', type: 'Text', required: true },
      { name: 'DateCreated', displayName: 'Date Created', type: 'DateTime', required: true },
      { name: 'RespondedBy', displayName: 'Responded By', type: 'Text' },
      { name: 'ResponseDate', displayName: 'Response Date', type: 'DateTime' },
      { name: 'CompletionDate', displayName: 'Completion Date', type: 'DateTime' },
      { name: 'Notes', displayName: 'Notes', type: 'Note' },
    ]
  },
  {
    name: 'ITPTemplates',
    description: 'Inspection and Test Plan templates',
    columns: [
      { name: 'TemplateName', displayName: 'Template Name', type: 'Text', required: true },
      { name: 'TemplateCode', displayName: 'Template Code', type: 'Text', required: true },
      { name: 'Division', displayName: 'Division', type: 'Choice', required: true, choices: ['Asphalt', 'Profiling', 'Spray', 'All'] },
      { name: 'WorkType', displayName: 'Work Type', type: 'Choice', choices: ['Wearing Course', 'Base Course', 'Profiling', 'Spray Seal', 'Line Marking'] },
      { name: 'Version', displayName: 'Version', type: 'Number', required: true },
      { name: 'TemplateData', displayName: 'Template Data (JSON)', type: 'Note', required: true },
      { name: 'IsActive', displayName: 'Is Active', type: 'Boolean' },
      { name: 'CreatedBy', displayName: 'Created By', type: 'Text' },
      { name: 'LastModified', displayName: 'Last Modified', type: 'DateTime' },
    ]
  },
  {
    name: 'SamplingPlans',
    description: 'Statistical sampling plans for QA testing',
    columns: [
      { name: 'PlanNumber', displayName: 'Plan Number', type: 'Text', required: true },
      { name: 'ProjectId', displayName: 'Project ID', type: 'Text', required: true },
      { name: 'JobId', displayName: 'Job ID', type: 'Text' },
      { name: 'SampleType', displayName: 'Sample Type', type: 'Choice', required: true, choices: ['Core', 'Loose Mix', 'Binder', 'Aggregate'] },
      { name: 'TestType', displayName: 'Test Type', type: 'Choice', choices: ['Density', 'Thickness', 'Voids', 'Binder Content', 'Grading'] },
      { name: 'Status', displayName: 'Status', type: 'Choice', required: true, choices: ['Planned', 'Sampled', 'Testing', 'Results Received', 'Completed'] },
      { name: 'SampleLocation', displayName: 'Sample Location', type: 'Text' },
      { name: 'SampleDate', displayName: 'Sample Date', type: 'DateTime' },
      { name: 'SampledBy', displayName: 'Sampled By', type: 'Text' },
      { name: 'PlanData', displayName: 'Plan Data (JSON)', type: 'Note' },
      { name: 'Results', displayName: 'Results', type: 'Note' },
      { name: 'PassFail', displayName: 'Pass/Fail', type: 'Choice', choices: ['Pass', 'Fail', 'Pending'] },
    ]
  },
  {
    name: 'Drafts',
    description: 'Autosave drafts and chat conversations',
    columns: [
      { name: 'DraftType', displayName: 'Draft Type', type: 'Choice', required: true, choices: ['Job', 'QAPack', 'Incident', 'NCR', 'ScopeReport', 'ChatConversation'] },
      { name: 'EntityId', displayName: 'Entity ID', type: 'Text' },
      { name: 'UserId', displayName: 'User ID', type: 'Text', required: true },
      { name: 'UserName', displayName: 'User Name', type: 'Text' },
      { name: 'DraftData', displayName: 'Draft Data (JSON)', type: 'Note', required: true },
      { name: 'LastSaved', displayName: 'Last Saved', type: 'DateTime', required: true },
      { name: 'MessageCount', displayName: 'Message Count', type: 'Number' },
    ]
  },
  {
    name: 'Notifications',
    description: 'System notifications for users',
    columns: [
      { name: 'NotificationType', displayName: 'Type', type: 'Choice', required: true, choices: ['Info', 'Warning', 'Action Required', 'Success', 'Error'] },
      { name: 'Category', displayName: 'Category', type: 'Choice', choices: ['Job', 'Project', 'QAPack', 'Incident', 'NCR', 'DivisionRequest', 'System'] },
      { name: 'UserId', displayName: 'User ID', type: 'Text', required: true },
      { name: 'Message', displayName: 'Message', type: 'Note', required: true },
      { name: 'IsRead', displayName: 'Is Read', type: 'Boolean' },
      { name: 'LinkUrl', displayName: 'Link URL', type: 'Text' },
      { name: 'EntityId', displayName: 'Entity ID', type: 'Text' },
      { name: 'CreatedDate', displayName: 'Created Date', type: 'DateTime', required: true },
      { name: 'ReadDate', displayName: 'Read Date', type: 'DateTime' },
    ]
  },
  {
    name: 'Resources',
    description: 'Crew and equipment resource tracking',
    columns: [
      { name: 'ResourceName', displayName: 'Resource Name', type: 'Text', required: true },
      { name: 'ResourceType', displayName: 'Resource Type', type: 'Choice', required: true, choices: ['Crew', 'Paver', 'Roller', 'Truck', 'Profiler', 'Spray Unit', 'Other Equipment'] },
      { name: 'Division', displayName: 'Division', type: 'Choice', choices: ['Asphalt', 'Profiling', 'Spray', 'Shared'] },
      { name: 'Status', displayName: 'Status', type: 'Choice', required: true, choices: ['Available', 'In Use', 'Maintenance', 'Out of Service'] },
      { name: 'AssignedJobId', displayName: 'Assigned Job ID', type: 'Text' },
      { name: 'RegistrationNumber', displayName: 'Registration/ID', type: 'Text' },
      { name: 'Capacity', displayName: 'Capacity', type: 'Text' },
      { name: 'LastServiceDate', displayName: 'Last Service Date', type: 'DateTime' },
      { name: 'Notes', displayName: 'Notes', type: 'Note' },
    ]
  }
];

// Document Libraries
const DOCUMENT_LIBRARIES = [
  { name: 'QADocuments', description: 'QA Pack PDFs and supporting documents' },
  { name: 'SitePhotos', description: 'Site photos from jobs and inspections' },
  { name: 'IncidentReports', description: 'Incident report documents and photos' },
  { name: 'NCRDocuments', description: 'NCR supporting documentation' },
  { name: 'ScopeReportDocs', description: 'Scope report attachments' },
];

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

  // Debug: decode token payload to check roles
  try {
    const payload = JSON.parse(Buffer.from(data.access_token.split('.')[1], 'base64').toString());
    console.log('   Token roles:', payload.roles || 'No roles found');
  } catch (e) {
    console.log('   Could not decode token');
  }

  return data.access_token;
}

// Get site ID from SharePoint URL
async function getSiteId(token: string): Promise<string> {
  const { SITE_URL } = getConfig();
  // Extract hostname and site path from URL
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

// Check if list exists
async function listExists(token: string, siteId: string, listName: string): Promise<boolean> {
  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listName}`;

  const response = await fetch(graphUrl, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  return response.ok;
}

// Create a list
async function createList(token: string, siteId: string, listDef: ListDefinition): Promise<void> {
  console.log(`\nCreating list: ${listDef.name}...`);

  // Check if list already exists
  if (await listExists(token, siteId, listDef.name)) {
    console.log(`  - List "${listDef.name}" already exists, skipping creation`);
    return;
  }

  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists`;

  // Build columns definition
  const columns = listDef.columns.map(col => {
    const colDef: any = {
      name: col.name,
      displayName: col.displayName,
      description: col.description || '',
    };

    switch (col.type) {
      case 'Text':
        colDef.text = { allowMultipleLines: false, maxLength: 255 };
        break;
      case 'Note':
        colDef.text = { allowMultipleLines: true };
        break;
      case 'Number':
        colDef.number = { decimalPlaces: 'automatic' };
        break;
      case 'DateTime':
        colDef.dateTime = { format: 'dateTime' };
        break;
      case 'Boolean':
        colDef.boolean = {};
        break;
      case 'Currency':
        colDef.currency = { locale: 'en-AU' };
        break;
      case 'Choice':
        colDef.choice = {
          allowTextEntry: false,
          choices: col.choices || [],
          displayAs: 'dropDownMenu'
        };
        break;
    }

    return colDef;
  });

  const listData = {
    displayName: listDef.name,
    description: listDef.description,
    columns: columns,
    list: {
      template: 'genericList',
    },
  };

  const response = await fetch(graphUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(listData),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`  ✗ Failed to create list "${listDef.name}": ${error}`);
    return;
  }

  console.log(`  ✓ Created list: ${listDef.name}`);
}

// Create document library
async function createDocumentLibrary(token: string, siteId: string, name: string, description: string): Promise<void> {
  console.log(`\nCreating document library: ${name}...`);

  // Check if exists
  if (await listExists(token, siteId, name)) {
    console.log(`  - Document library "${name}" already exists, skipping`);
    return;
  }

  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists`;

  const libraryData = {
    displayName: name,
    description: description,
    list: {
      template: 'documentLibrary',
    },
  };

  const response = await fetch(graphUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(libraryData),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`  ✗ Failed to create library "${name}": ${error}`);
    return;
  }

  console.log(`  ✓ Created document library: ${name}`);
}

// Main function
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     SGA QA SYSTEM - SharePoint Setup Script                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  // Get config after dotenv has loaded
  const { SITE_URL, CLIENT_ID, CLIENT_SECRET, TENANT_ID } = getConfig();

  // Validate configuration
  if (!SITE_URL || !CLIENT_ID || !CLIENT_SECRET || !TENANT_ID) {
    console.error('❌ Missing required environment variables!');
    console.error('Required: SHAREPOINT_SITE_URL, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID');
    console.error('Debug - found:', { SITE_URL: !!SITE_URL, CLIENT_ID: !!CLIENT_ID, CLIENT_SECRET: !!CLIENT_SECRET, TENANT_ID: !!TENANT_ID });
    process.exit(1);
  }

  console.log(`SharePoint Site: ${SITE_URL}`);
  console.log(`Tenant ID: ${TENANT_ID}`);
  console.log('');

  try {
    // Get access token
    console.log('1. Acquiring access token...');
    const token = await getAccessToken();
    console.log('   ✓ Access token acquired');

    // Get site ID
    console.log('\n2. Getting SharePoint site ID...');
    const siteId = await getSiteId(token);
    console.log(`   ✓ Site ID: ${siteId}`);

    // Create lists
    console.log('\n3. Creating SharePoint Lists...');
    console.log('─'.repeat(60));

    for (const listDef of SGA_LISTS) {
      await createList(token, siteId, listDef);
    }

    // Create document libraries
    console.log('\n4. Creating Document Libraries...');
    console.log('─'.repeat(60));

    for (const lib of DOCUMENT_LIBRARIES) {
      await createDocumentLibrary(token, siteId, lib.name, lib.description);
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('✅ SharePoint Setup Complete!');
    console.log('');
    console.log('Created/Verified:');
    console.log(`  • ${SGA_LISTS.length} SharePoint Lists`);
    console.log(`  • ${DOCUMENT_LIBRARIES.length} Document Libraries`);
    console.log('');
    console.log('Next Steps:');
    console.log('  1. Verify lists in SharePoint site');
    console.log('  2. Deploy the application to Vercel');
    console.log('  3. Test API endpoints');

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run
main();
