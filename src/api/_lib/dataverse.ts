// src/api/_lib/dataverse.ts
// Dataverse Web API Client for SGA QA Pack

/**
 * Dataverse Web API client for accessing Microsoft Dataverse tables
 * Replaces Redis/Upstash storage with Dataverse backend
 */

// Environment variables
const DATAVERSE_URL = process.env.DATAVERSE_URL || 'https://org24044a7d.crm6.dynamics.com';
const CLIENT_ID = process.env.CLIENT_ID!;
const CLIENT_SECRET = process.env.CLIENT_SECRET!;
const TENANT_ID = process.env.TENANT_ID!;

// Token cache
let accessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Get access token for Dataverse API
 * Uses client credentials flow (service principal)
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: `${DATAVERSE_URL}/.default`,
    grant_type: 'client_credentials'
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  // Token expires in 1 hour, refresh 5 minutes before expiry
  tokenExpiry = Date.now() + ((data.expires_in - 300) * 1000);

  return accessToken;
}

/**
 * Make authenticated request to Dataverse Web API
 */
async function dataverseRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const token = await getAccessToken();

  const url = `${DATAVERSE_URL}/api/data/v9.2/${endpoint}`;

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'OData-MaxVersion': '4.0',
    'OData-Version': '4.0',
    'Accept': 'application/json',
    'Prefer': 'return=representation',
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Dataverse API error: ${response.status} - ${errorText}`);
  }

  // Handle 204 No Content responses
  if (response.status === 204) {
    return null;
  }

  return await response.json();
}

/**
 * Dataverse Table Names (logical names)
 * Maps our friendly names to Dataverse entity names
 */
export const Tables = {
  Job: 'cr3cd_job',
  Foreman: 'cr3cd_foreman',
  QAPack: 'cr3cd_qapack',
  DailyReport: 'cr3cd_dailyreport',
  Incident: 'cr3cd_incident',
  NCR: 'cr3cd_ncr',
  SamplingPlan: 'cr3cd_samplingplan',
  Resource: 'cr3cd_resource',
  ITPTemplate: 'cr3cd_itptemplate',
  SitePhoto: 'cr3cd_sitephoto',
  AsphaltPlacement: 'cr3cd_asphaltplacement',
  StraightEdgeReport: 'cr3cd_straightedgereport'
};

/**
 * Get all records from a table
 */
export async function getRecords(
  tableName: string,
  select?: string[],
  filter?: string,
  orderBy?: string,
  top?: number
): Promise<any[]> {
  let query = tableName;
  const params: string[] = [];

  if (select && select.length > 0) {
    params.push(`$select=${select.join(',')}`);
  }
  if (filter) {
    params.push(`$filter=${encodeURIComponent(filter)}`);
  }
  if (orderBy) {
    params.push(`$orderby=${orderBy}`);
  }
  if (top) {
    params.push(`$top=${top}`);
  }

  if (params.length > 0) {
    query += '?' + params.join('&');
  }

  const response = await dataverseRequest(query);
  return response.value || [];
}

/**
 * Get a single record by ID
 */
export async function getRecord(
  tableName: string,
  recordId: string,
  select?: string[]
): Promise<any> {
  let query = `${tableName}(${recordId})`;

  if (select && select.length > 0) {
    query += `?$select=${select.join(',')}`;
  }

  return await dataverseRequest(query);
}

/**
 * Create a new record
 */
export async function createRecord(
  tableName: string,
  data: Record<string, any>
): Promise<any> {
  return await dataverseRequest(tableName, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Update an existing record
 */
export async function updateRecord(
  tableName: string,
  recordId: string,
  data: Record<string, any>
): Promise<void> {
  await dataverseRequest(`${tableName}(${recordId})`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

/**
 * Delete a record
 */
export async function deleteRecord(
  tableName: string,
  recordId: string
): Promise<void> {
  await dataverseRequest(`${tableName}(${recordId})`, {
    method: 'DELETE'
  });
}

/**
 * Search records using FetchXML (advanced queries)
 */
export async function fetchXML(
  tableName: string,
  fetchXMLQuery: string
): Promise<any[]> {
  const encodedQuery = encodeURIComponent(fetchXMLQuery);
  const response = await dataverseRequest(`${tableName}?fetchXml=${encodedQuery}`);
  return response.value || [];
}

/**
 * Execute a batch request (for multiple operations)
 */
export async function executeBatch(requests: any[]): Promise<any> {
  const batchId = `batch_${Date.now()}`;
  const changesetId = `changeset_${Date.now()}`;

  // Batch requests require multipart/mixed content type
  // Implementation would go here for complex batch operations
  throw new Error('Batch operations not yet implemented');
}

// Export helper for common queries

/**
 * Get all jobs for a specific foreman
 */
export async function getJobsByForeman(foremanEmail: string): Promise<any[]> {
  return await getRecords(
    Tables.Job,
    undefined,
    `_cr6d1_foremanid_value eq '${foremanEmail}'`,
    'createdon desc'
  );
}

/**
 * Get all QA Packs for a specific job
 */
export async function getQAPacksByJob(jobId: string): Promise<any[]> {
  return await getRecords(
    Tables.QAPack,
    undefined,
    `_cr6d1_jobid_value eq '${jobId}'`,
    'createdon desc'
  );
}

/**
 * Get recent incidents (last 30 days)
 */
export async function getRecentIncidents(days: number = 30): Promise<any[]> {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const dateStr = date.toISOString();

  return await getRecords(
    Tables.Incident,
    undefined,
    `createdon ge ${dateStr}`,
    'createdon desc'
  );
}

export default {
  Tables,
  getRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  fetchXML,
  getJobsByForeman,
  getQAPacksByJob,
  getRecentIncidents
};
