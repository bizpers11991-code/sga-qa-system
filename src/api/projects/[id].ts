/**
 * @file src/api/projects/[id].ts
 * @description GET /api/projects/[id] - Get single project by ID
 * Includes related data (jobs, scope reports)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  ProjectsListService,
  JobsListService,
  ScopeReportsListService,
} from '@/lib/sharepoint';
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
  Divisions?: string;
  JobIds?: string;
  ScopeReportIds?: string;
  SiteVisitEventIds?: string;
  ProjectCalendarEventId?: string;
  QAPackIds?: string;
  NCRIds?: string;
  IncidentIds?: string;
}

interface JobSharePointItem extends SharePointListItem {
  JobNo: string;
  Client: string;
  Division: 'Asphalt' | 'Profiling' | 'Spray';
  ProjectName: string;
  Location: string;
  ForemanId: string;
  JobDate: string;
  DueDate: string;
  Status: string;
}

interface ScopeReportSharePointItem extends SharePointListItem {
  ReportNumber: string;
  ProjectId: string;
  VisitNumber: number;
  VisitType: '14-Day' | '7-Day' | '3-Day' | '72-Hour';
  Status: string;
  CompletedBy: string;
  ActualDate: string;
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
 * Handler for GET /api/projects/[id]
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract project ID from query
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Project ID is required' });
    }

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

    // Get project from SharePoint
    const projectId = parseInt(id);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const spItem = await ProjectsListService.getItem<ProjectSharePointItem>(projectId);
    const project = mapSharePointToProject(spItem);

    // Optionally fetch related data
    const includeRelated = req.query.include;
    const response: any = { project };

    if (includeRelated) {
      const includes = Array.isArray(includeRelated) ? includeRelated : [includeRelated];

      // Fetch jobs if requested
      if (includes.includes('jobs') && project.jobIds.length > 0) {
        try {
          const jobFilter = project.jobIds
            .map(jobId => `Id eq ${jobId}`)
            .join(' or ');

          const jobs = await JobsListService.getItems<JobSharePointItem>({
            filter: jobFilter,
            top: 100,
          });

          response.jobs = jobs;
        } catch (error) {
          console.error('Error fetching jobs:', error);
          response.jobs = [];
        }
      }

      // Fetch scope reports if requested
      if (includes.includes('scopeReports') && project.scopeReportIds.length > 0) {
        try {
          const reportFilter = project.scopeReportIds
            .map(reportId => `Id eq ${reportId}`)
            .join(' or ');

          const scopeReports = await ScopeReportsListService.getItems<ScopeReportSharePointItem>({
            filter: reportFilter,
            orderBy: 'VisitNumber',
            top: 100,
          });

          response.scopeReports = scopeReports;
        } catch (error) {
          console.error('Error fetching scope reports:', error);
          response.scopeReports = [];
        }
      }
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching project:', error);

    // Handle 404 - project not found
    if (error && typeof error === 'object' && 'statusCode' in error) {
      if ((error as any).statusCode === 404) {
        return res.status(404).json({ error: 'Project not found' });
      }
    }

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to fetch project',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to fetch project',
      message: 'An unknown error occurred',
    });
  }
}

export default handler;
