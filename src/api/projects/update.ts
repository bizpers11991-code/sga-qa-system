/**
 * @file src/api/projects/update.ts
 * @description PUT /api/projects/update - Update project
 * Validates with ProjectUpdateSchema and checks edit_project permission
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ProjectsListService } from '@/lib/sharepoint';
import { checkPermission, requirePermission } from '@/lib/auth/permissions';
import { ProjectUpdateSchema } from '@/lib/validation/schemas';
import type { Project } from '@/types';
import type { SharePointListItem, UpdateItemData } from '@/lib/sharepoint/types';

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
 * Map frontend Project update to SharePoint update data
 */
function mapProjectUpdateToSharePoint(
  updates: any
): UpdateItemData<ProjectSharePointItem> {
  const sharePointUpdate: any = {};

  // Map fields that exist in updates
  if (updates.handoverId !== undefined) sharePointUpdate.HandoverId = updates.handoverId;
  if (updates.projectName !== undefined) sharePointUpdate.ProjectName = updates.projectName;
  if (updates.client !== undefined) sharePointUpdate.Client = updates.client;
  if (updates.clientTier !== undefined) sharePointUpdate.ClientTier = updates.clientTier;
  if (updates.location !== undefined) sharePointUpdate.Location = updates.location;
  if (updates.projectOwnerId !== undefined) sharePointUpdate.ProjectOwnerId = updates.projectOwnerId;
  if (updates.projectOwnerDivision !== undefined) sharePointUpdate.ProjectOwnerDivision = updates.projectOwnerDivision;
  if (updates.scopingPersonId !== undefined) sharePointUpdate.ScopingPersonId = updates.scopingPersonId;
  if (updates.estimatedStartDate !== undefined) sharePointUpdate.EstimatedStartDate = updates.estimatedStartDate;
  if (updates.estimatedEndDate !== undefined) sharePointUpdate.EstimatedEndDate = updates.estimatedEndDate;
  if (updates.actualStartDate !== undefined) sharePointUpdate.ActualStartDate = updates.actualStartDate;
  if (updates.actualEndDate !== undefined) sharePointUpdate.ActualEndDate = updates.actualEndDate;

  // Map arrays/objects (convert to JSON)
  if (updates.divisions !== undefined) sharePointUpdate.Divisions = JSON.stringify(updates.divisions);
  if (updates.jobIds !== undefined) sharePointUpdate.JobIds = JSON.stringify(updates.jobIds);
  if (updates.scopeReportIds !== undefined) sharePointUpdate.ScopeReportIds = JSON.stringify(updates.scopeReportIds);
  if (updates.siteVisitEventIds !== undefined) sharePointUpdate.SiteVisitEventIds = JSON.stringify(updates.siteVisitEventIds);
  if (updates.projectCalendarEventId !== undefined) sharePointUpdate.ProjectCalendarEventId = updates.projectCalendarEventId;
  if (updates.qaPackIds !== undefined) sharePointUpdate.QAPackIds = JSON.stringify(updates.qaPackIds);
  if (updates.ncrIds !== undefined) sharePointUpdate.NCRIds = JSON.stringify(updates.ncrIds);
  if (updates.incidentIds !== undefined) sharePointUpdate.IncidentIds = JSON.stringify(updates.incidentIds);

  return sharePointUpdate;
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
 * Handler for PUT /api/projects/update
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') {
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

    // Get project ID from body
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const projectId = parseInt(id);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    // Get existing project to check ownership
    let existingProject: ProjectSharePointItem;
    try {
      existingProject = await ProjectsListService.getItem<ProjectSharePointItem>(projectId);
    } catch (error) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check permission - allow edit if user owns the project or has edit_any_project
    const canEditOwn = checkPermission(
      mockUser as any,
      'edit_own_project',
      { ownerId: existingProject.ProjectOwnerId }
    );

    const canEditAny = checkPermission(
      mockUser as any,
      'edit_any_project'
    );

    if (!canEditOwn.allowed && !canEditAny.allowed) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to edit this project',
      });
    }

    // Validate request body
    let validatedData;
    try {
      validatedData = ProjectUpdateSchema.parse(req.body);
    } catch (error: any) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors || error.message,
      });
    }

    // Map to SharePoint format
    const sharePointUpdate = mapProjectUpdateToSharePoint(validatedData);

    // Update project in SharePoint
    await ProjectsListService.updateItem<ProjectSharePointItem>(
      projectId,
      sharePointUpdate
    );

    // Fetch updated project
    const updatedItem = await ProjectsListService.getItem<ProjectSharePointItem>(projectId);
    const project = mapSharePointToProject(updatedItem);

    return res.status(200).json({
      message: 'Project updated successfully',
      project,
    });

  } catch (error) {
    console.error('Error updating project:', error);

    // Handle 404 - project not found
    if (error && typeof error === 'object' && 'statusCode' in error) {
      if ((error as any).statusCode === 404) {
        return res.status(404).json({ error: 'Project not found' });
      }
    }

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to update project',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to update project',
      message: 'An unknown error occurred',
    });
  }
}

export default handler;
