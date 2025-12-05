/**
 * @file src/api/projects/list.ts
 * @description GET /api/projects/list - Get all projects with filters
 * Uses SharePoint integration layer for data access
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ProjectsListService } from '@/lib/sharepoint';
import { checkPermission } from '@/lib/auth/permissions';
import type { Project } from '@/types';
import type { SharePointListItem } from '@/lib/sharepoint/types';

// SharePoint field mapping
interface ProjectSharePointItem extends SharePointListItem {
  ProjectNumber: string;
  HandoverId: string;
  ProjectName: string;
  Client: string;
  ClientTier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  Location: string;
  ProjectOwnerId: string;
  ProjectOwnerDivision: 'Asphalt' | 'Profiling' | 'Spray';
  ScopingPersonId: string;
  EstimatedStartDate: string;
  EstimatedEndDate: string;
  ActualStartDate?: string;
  ActualEndDate?: string;
  Status: 'Scoping' | 'Scheduled' | 'In Progress' | 'QA Review' | 'Completed' | 'On Hold';
  Divisions?: string; // JSON string
  JobIds?: string; // JSON string
  ScopeReportIds?: string; // JSON string
  SiteVisitEventIds?: string; // JSON string
  ProjectCalendarEventId?: string;
  QAPackIds?: string; // JSON string
  NCRIds?: string; // JSON string
  IncidentIds?: string; // JSON string
}

/**
 * Map SharePoint item to frontend Project type
 */
function mapSharePointToProject(spItem: ProjectSharePointItem): Project {
  return {
    id: spItem.Id.toString(),
    projectNumber: spItem.ProjectNumber,
    handoverId: spItem.HandoverId,
    projectName: spItem.ProjectName,
    client: spItem.Client,
    clientTier: spItem.ClientTier,
    location: spItem.Location,
    projectOwnerId: spItem.ProjectOwnerId,
    projectOwnerDivision: spItem.ProjectOwnerDivision,
    scopingPersonId: spItem.ScopingPersonId,
    estimatedStartDate: spItem.EstimatedStartDate,
    estimatedEndDate: spItem.EstimatedEndDate,
    actualStartDate: spItem.ActualStartDate,
    actualEndDate: spItem.ActualEndDate,
    status: spItem.Status,
    divisions: spItem.Divisions ? JSON.parse(spItem.Divisions) : [],
    jobIds: spItem.JobIds ? JSON.parse(spItem.JobIds) : [],
    scopeReportIds: spItem.ScopeReportIds ? JSON.parse(spItem.ScopeReportIds) : [],
    siteVisitEventIds: spItem.SiteVisitEventIds ? JSON.parse(spItem.SiteVisitEventIds) : undefined,
    projectCalendarEventId: spItem.ProjectCalendarEventId,
    qaPackIds: spItem.QAPackIds ? JSON.parse(spItem.QAPackIds) : undefined,
    ncrIds: spItem.NCRIds ? JSON.parse(spItem.NCRIds) : undefined,
    incidentIds: spItem.IncidentIds ? JSON.parse(spItem.IncidentIds) : undefined,
  };
}

/**
 * Build OData filter based on query parameters and user role
 */
function buildFilter(
  query: Record<string, any>,
  userId: string,
  userRole: string
): string | undefined {
  const filters: string[] = [];

  // Status filter
  if (query.status) {
    const statuses = Array.isArray(query.status) ? query.status : [query.status];
    const statusFilters = statuses.map((s: string) => `Status eq '${s}'`);
    if (statusFilters.length > 0) {
      filters.push(`(${statusFilters.join(' or ')})`);
    }
  }

  // Division filter
  if (query.division) {
    filters.push(`ProjectOwnerDivision eq '${query.division}'`);
  }

  // Client filter
  if (query.client) {
    filters.push(`Client eq '${query.client}'`);
  }

  // Date range filter
  if (query.startDate) {
    filters.push(`EstimatedStartDate ge '${query.startDate}'`);
  }
  if (query.endDate) {
    filters.push(`EstimatedEndDate le '${query.endDate}'`);
  }

  // Role-based filtering
  // Foremen can only see projects they're assigned to
  const foremanRoles = ['asphalt_foreman', 'profiling_foreman', 'spray_foreman'];
  if (foremanRoles.includes(userRole)) {
    filters.push(`ScopingPersonId eq '${userId}'`);
  }

  // Division engineers see only their division's projects
  const divisionMap: Record<string, string> = {
    'asphalt_engineer': 'Asphalt',
    'profiling_engineer': 'Profiling',
    'spray_admin': 'Spray',
  };
  if (divisionMap[userRole]) {
    filters.push(`ProjectOwnerDivision eq '${divisionMap[userRole]}'`);
  }

  return filters.length > 0 ? filters.join(' and ') : undefined;
}

/**
 * Handler for GET /api/projects/list
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Auth check - we'll use a simple check since withAuth is not available yet
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock user for now - in production, extract from token
    const mockUser = {
      id: 'user-123',
      role: 'management_admin' as any,
    };

    // Check view_project permission
    const permissionResult = checkPermission(
      mockUser as any,
      'view_project'
    );

    if (!permissionResult.allowed) {
      return res.status(403).json({
        error: 'Forbidden',
        reason: permissionResult.reason
      });
    }

    // Build filter based on query params and user role
    const filter = buildFilter(req.query, mockUser.id, mockUser.role);

    // Get projects from SharePoint
    const spItems = await ProjectsListService.getItems<ProjectSharePointItem>({
      filter,
      orderBy: 'EstimatedStartDate',
      orderByDescending: false,
      top: req.query.limit ? parseInt(req.query.limit as string) : 100,
      skip: req.query.offset ? parseInt(req.query.offset as string) : 0,
    });

    // Map to frontend type
    const projects = spItems.map(mapSharePointToProject);

    return res.status(200).json({
      projects,
      total: projects.length,
    });

  } catch (error) {
    console.error('Error fetching projects:', error);

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to fetch projects',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to fetch projects',
      message: 'An unknown error occurred',
    });
  }
}

export default handler;
