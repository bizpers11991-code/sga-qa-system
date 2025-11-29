/**
 * Data Query Engine
 *
 * Converts natural language queries to SharePoint data operations.
 */

import type {
  ClassificationResult,
  DataQueryResult,
  EntityType,
} from '../../../src/types/chat.js';
import {
  JobsData,
  ProjectsData,
  IncidentsData,
  TendersData,
  NCRsData,
} from '../../_lib/sharepointData.js';

/**
 * Date range helper
 */
function getDateRange(dateParam: string | Date): { start: Date; end: Date } | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (dateParam instanceof Date) {
    const start = new Date(dateParam);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateParam);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  switch (dateParam) {
    case 'this_week': {
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return { start: monday, end: sunday };
    }
    case 'last_week': {
      const dayOfWeek = today.getDay();
      const lastMonday = new Date(today);
      lastMonday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) - 7);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      lastSunday.setHours(23, 59, 59, 999);
      return { start: lastMonday, end: lastSunday };
    }
    case 'next_week': {
      const dayOfWeek = today.getDay();
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + (dayOfWeek === 0 ? 1 : 8 - dayOfWeek));
      const nextSunday = new Date(nextMonday);
      nextSunday.setDate(nextMonday.getDate() + 6);
      nextSunday.setHours(23, 59, 59, 999);
      return { start: nextMonday, end: nextSunday };
    }
    default:
      return null;
  }
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Execute a data query based on classification
 */
export async function executeDataQuery(
  query: string,
  classification: ClassificationResult
): Promise<DataQueryResult> {
  const { parameters, entities } = classification;
  const entityType = (parameters.entityType || 'job') as EntityType;

  try {
    switch (entityType) {
      case 'job':
        return await queryJobs(query, parameters, entities);
      case 'project':
        return await queryProjects(query, parameters);
      case 'incident':
        return await queryIncidents(query, parameters);
      case 'ncr':
        return await queryNCRs(query, parameters);
      case 'tender':
        return await queryTenders(query, parameters);
      default:
        return await queryJobs(query, parameters, entities);
    }
  } catch (error) {
    console.error('[DataQueryEngine] Error:', error);
    return {
      query,
      results: [],
      totalCount: 0,
      entityType,
      filters: parameters,
    };
  }
}

/**
 * Query jobs
 */
async function queryJobs(
  query: string,
  parameters: Record<string, any>,
  entities: any[]
): Promise<DataQueryResult> {
  const filters: Record<string, any> = {};

  // Apply division filter
  if (parameters.division) {
    filters.division = parameters.division;
  }

  // Apply status filter based on query
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('pending')) {
    filters.status = 'Pending';
  } else if (lowerQuery.includes('in progress') || lowerQuery.includes('active')) {
    filters.status = 'In Progress';
  } else if (lowerQuery.includes('completed') || lowerQuery.includes('done')) {
    filters.status = 'Completed';
  } else if (lowerQuery.includes('qa pending')) {
    filters.status = 'QA Pending';
  }

  // Get all jobs with filters
  let jobs = await JobsData.getAll(filters);

  // Apply date filter
  if (parameters.date) {
    const dateRange = getDateRange(parameters.date);
    if (dateRange) {
      jobs = jobs.filter(job => {
        const jobDate = new Date(job.jobDate);
        return jobDate >= dateRange.start && jobDate <= dateRange.end;
      });
    }
  }

  // Filter by specific job number if provided
  if (parameters.jobNo) {
    jobs = jobs.filter(job =>
      job.jobNo.toUpperCase().includes(parameters.jobNo.toUpperCase())
    );
  }

  return {
    query,
    results: jobs.slice(0, 20), // Limit results
    totalCount: jobs.length,
    entityType: 'job',
    filters,
  };
}

/**
 * Query projects
 */
async function queryProjects(
  query: string,
  parameters: Record<string, any>
): Promise<DataQueryResult> {
  const filters: Record<string, any> = {};

  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('active') || lowerQuery.includes('in progress')) {
    filters.status = 'In Progress';
  } else if (lowerQuery.includes('scoping')) {
    filters.status = 'Scoping';
  } else if (lowerQuery.includes('completed')) {
    filters.status = 'Completed';
  }

  if (parameters.division) {
    filters.division = parameters.division;
  }

  const projects = await ProjectsData.getAll(filters);

  return {
    query,
    results: projects.slice(0, 20),
    totalCount: projects.length,
    entityType: 'project',
    filters,
  };
}

/**
 * Query incidents
 */
async function queryIncidents(
  query: string,
  parameters: Record<string, any>
): Promise<DataQueryResult> {
  let filter: string | undefined;

  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('open')) {
    filter = "Status eq 'Open'";
  } else if (lowerQuery.includes('closed')) {
    filter = "Status eq 'Closed'";
  }

  const incidents = await IncidentsData.getAll(filter);

  // Apply date filter
  let filteredIncidents = incidents;
  if (parameters.date) {
    const dateRange = getDateRange(parameters.date);
    if (dateRange) {
      filteredIncidents = incidents.filter((incident: any) => {
        const incidentDate = new Date(incident.dateReported || incident.created);
        return incidentDate >= dateRange.start && incidentDate <= dateRange.end;
      });
    }
  }

  return {
    query,
    results: filteredIncidents.slice(0, 20),
    totalCount: filteredIncidents.length,
    entityType: 'incident',
  };
}

/**
 * Query NCRs
 */
async function queryNCRs(
  query: string,
  parameters: Record<string, any>
): Promise<DataQueryResult> {
  let filter: string | undefined;

  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('open') || lowerQuery.includes('pending')) {
    filter = "Status eq 'Open'";
  } else if (lowerQuery.includes('closed')) {
    filter = "Status eq 'Closed'";
  }

  const ncrs = await NCRsData.getAll(filter);

  return {
    query,
    results: ncrs.slice(0, 20),
    totalCount: ncrs.length,
    entityType: 'ncr',
  };
}

/**
 * Query tenders/handovers
 */
async function queryTenders(
  query: string,
  parameters: Record<string, any>
): Promise<DataQueryResult> {
  const filters: Record<string, any> = {};

  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('approved')) {
    filters.status = 'Approved';
  } else if (lowerQuery.includes('pending') || lowerQuery.includes('draft')) {
    filters.status = 'Draft';
  }

  const tenders = await TendersData.getAll(filters);

  return {
    query,
    results: tenders.slice(0, 20),
    totalCount: tenders.length,
    entityType: 'tender',
  };
}

/**
 * Format query results for chat display
 */
export function formatQueryResults(result: DataQueryResult): string {
  const { results, totalCount, entityType } = result;

  if (totalCount === 0) {
    return `No ${entityType}s found matching your query.`;
  }

  let response = `Found **${totalCount}** ${entityType}${totalCount === 1 ? '' : 's'}.\n\n`;

  switch (entityType) {
    case 'job':
      response += formatJobResults(results);
      break;
    case 'project':
      response += formatProjectResults(results);
      break;
    case 'incident':
      response += formatIncidentResults(results);
      break;
    case 'ncr':
      response += formatNCRResults(results);
      break;
    case 'tender':
      response += formatTenderResults(results);
      break;
    default:
      response += `Results:\n`;
      results.slice(0, 5).forEach((item: any) => {
        response += `- ${item.title || item.id}\n`;
      });
  }

  if (totalCount > 5) {
    response += `\n*...and ${totalCount - 5} more*`;
  }

  return response;
}

/**
 * Format job results
 */
function formatJobResults(jobs: any[]): string {
  if (jobs.length === 0) return '';

  let response = '| Job # | Client | Division | Date | Status |\n';
  response += '|-------|--------|----------|------|--------|\n';

  jobs.slice(0, 5).forEach(job => {
    const date = job.jobDate ? formatDate(new Date(job.jobDate)) : '-';
    response += `| ${job.jobNo} | ${job.client || '-'} | ${job.division} | ${date} | ${job.status} |\n`;
  });

  return response;
}

/**
 * Format project results
 */
function formatProjectResults(projects: any[]): string {
  if (projects.length === 0) return '';

  let response = '';
  projects.slice(0, 5).forEach(project => {
    response += `- **${project.projectNumber}**: ${project.projectName}\n`;
    response += `  Client: ${project.client} | Status: ${project.status}\n`;
  });

  return response;
}

/**
 * Format incident results
 */
function formatIncidentResults(incidents: any[]): string {
  if (incidents.length === 0) return '';

  // Count by status
  const open = incidents.filter((i: any) => i.status === 'Open').length;
  const closed = incidents.filter((i: any) => i.status === 'Closed').length;

  let response = `**${open}** open, **${closed}** closed\n\n`;

  incidents.slice(0, 5).forEach((incident: any) => {
    response += `- ${incident.type || 'Incident'}: ${incident.description?.substring(0, 50) || 'No description'}...\n`;
    response += `  Status: ${incident.status}\n`;
  });

  return response;
}

/**
 * Format NCR results
 */
function formatNCRResults(ncrs: any[]): string {
  if (ncrs.length === 0) return '';

  let response = '';
  ncrs.slice(0, 5).forEach((ncr: any) => {
    response += `- **${ncr.ncrNumber || ncr.id}**: ${ncr.description?.substring(0, 50) || 'No description'}...\n`;
    response += `  Status: ${ncr.status} | Severity: ${ncr.severity || '-'}\n`;
  });

  return response;
}

/**
 * Format tender results
 */
function formatTenderResults(tenders: any[]): string {
  if (tenders.length === 0) return '';

  let response = '';
  tenders.slice(0, 5).forEach(tender => {
    response += `- **${tender.handoverNumber}**: ${tender.projectName}\n`;
    response += `  Client: ${tender.clientName} | Status: ${tender.status}\n`;
  });

  return response;
}

export default {
  executeDataQuery,
  formatQueryResults,
};
