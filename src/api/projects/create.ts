/**
 * @file src/api/projects/create.ts
 * @description POST /api/projects/create - Create new project
 * Validates with ProjectCreateSchema and auto-generates project number
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ProjectsListService } from '@/lib/sharepoint';
import { requirePermission } from '@/lib/auth/permissions';
import { ProjectCreateSchema } from '@/lib/validation/schemas';
import type { Project, ProjectDivision } from '@/types';
import type { SharePointListItem, CreateItemData } from '@/lib/sharepoint/types';

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

/**
 * Generate unique project number
 * Format: PRJ-YYYY-NNN
 */
async function generateProjectNumber(): Promise<string> {
  const year = new Date().getFullYear();

  // Get all projects from current year
  const yearFilter = `ProjectNumber ge 'PRJ-${year}-000' and ProjectNumber le 'PRJ-${year}-999'`;

  try {
    const existingProjects = await ProjectsListService.getItems<ProjectSharePointItem>({
      filter: yearFilter,
      select: ['ProjectNumber'],
      orderBy: 'ProjectNumber',
      orderByDescending: true,
      top: 1,
    });

    let nextNumber = 1;

    if (existingProjects.length > 0) {
      // Extract number from last project
      const lastNumber = existingProjects[0].ProjectNumber;
      const match = lastNumber.match(/PRJ-\d{4}-(\d{3})/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `PRJ-${year}-${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating project number:', error);
    // Fallback to timestamp-based number
    return `PRJ-${year}-${Date.now().toString().slice(-3)}`;
  }
}

/**
 * Map frontend Project to SharePoint create data
 */
function mapProjectToSharePoint(
  project: any,
  projectNumber: string
): CreateItemData<ProjectSharePointItem> {
  return {
    ProjectNumber: projectNumber,
    HandoverId: project.handoverId,
    ProjectName: project.projectName,
    Client: project.client,
    ClientTier: project.clientTier,
    Location: project.location,
    ProjectOwnerId: project.projectOwnerId,
    ProjectOwnerDivision: project.projectOwnerDivision,
    ScopingPersonId: project.scopingPersonId,
    EstimatedStartDate: project.estimatedStartDate,
    EstimatedEndDate: project.estimatedEndDate,
    ActualStartDate: project.actualStartDate,
    ActualEndDate: project.actualEndDate,
    Status: 'Scoping', // New projects start in Scoping status
    Divisions: project.divisions ? JSON.stringify(project.divisions) : JSON.stringify([]),
    JobIds: project.jobIds ? JSON.stringify(project.jobIds) : JSON.stringify([]),
    ScopeReportIds: project.scopeReportIds ? JSON.stringify(project.scopeReportIds) : JSON.stringify([]),
    SiteVisitEventIds: project.siteVisitEventIds ? JSON.stringify(project.siteVisitEventIds) : undefined,
    ProjectCalendarEventId: project.projectCalendarEventId,
    QAPackIds: project.qaPackIds ? JSON.stringify(project.qaPackIds) : undefined,
    NCRIds: project.ncrIds ? JSON.stringify(project.ncrIds) : undefined,
    IncidentIds: project.incidentIds ? JSON.stringify(project.incidentIds) : undefined,
  };
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
 * Handler for POST /api/projects/create
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
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
      name: 'Test User',
      email: 'test@example.com',
      role: 'management_admin' as any,
    };

    // Check create_project permission
    try {
      requirePermission(mockUser as any, 'create_project');
    } catch (error) {
      return res.status(403).json({
        error: 'Forbidden',
        message: error instanceof Error ? error.message : 'Permission denied'
      });
    }

    // Validate request body
    let validatedData;
    try {
      validatedData = ProjectCreateSchema.parse(req.body);
    } catch (error: any) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors || error.message,
      });
    }

    // Generate project number
    const projectNumber = await generateProjectNumber();

    // Initialize divisions array if not provided
    if (!validatedData.divisions || validatedData.divisions.length === 0) {
      const divisions: ProjectDivision[] = [];

      // Create division entry for the owner's division
      divisions.push({
        division: validatedData.projectOwnerDivision,
        status: 'Assigned',
        assignedEngineerId: validatedData.projectOwnerId,
        assignedCrewIds: [],
        scheduledDates: [],
        completedDates: [],
        qaPackIds: [],
      });

      validatedData.divisions = divisions;
    }

    // Map to SharePoint format
    const sharePointData = mapProjectToSharePoint(validatedData, projectNumber);

    // Create project in SharePoint
    const createdItem = await ProjectsListService.createItem<ProjectSharePointItem>(
      sharePointData
    );

    // Map back to frontend type
    const project = mapSharePointToProject(createdItem);

    return res.status(201).json({
      message: 'Project created successfully',
      project,
    });

  } catch (error) {
    console.error('Error creating project:', error);

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to create project',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to create project',
      message: 'An unknown error occurred',
    });
  }
}

export default handler;
