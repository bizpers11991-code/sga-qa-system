/**
 * @file src/api/projects/update-status.ts
 * @description PUT /api/projects/update-status - Update project status
 * Validates status transitions and checks appropriate permissions
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ProjectsListService } from '@/lib/sharepoint';
import { checkPermission } from '@/lib/auth/permissions';
import { z } from 'zod';
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
 * Validation schema for status update
 */
const StatusUpdateSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
  status: z.enum(['Scoping', 'Scheduled', 'In Progress', 'QA Review', 'Completed', 'On Hold'], {
    errorMap: () => ({ message: 'Invalid project status' })
  }),
  actualStartDate: z.string().optional(),
  actualEndDate: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Valid status transitions
 * Defines which status changes are allowed
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  'Scoping': ['Scheduled', 'On Hold'],
  'Scheduled': ['In Progress', 'On Hold'],
  'In Progress': ['QA Review', 'On Hold', 'Completed'],
  'QA Review': ['Completed', 'In Progress', 'On Hold'],
  'Completed': ['QA Review'], // Can reopen if needed
  'On Hold': ['Scoping', 'Scheduled', 'In Progress', 'QA Review'],
};

/**
 * Check if status transition is valid
 */
function isValidTransition(currentStatus: string, newStatus: string): boolean {
  if (currentStatus === newStatus) {
    return true; // Same status is always valid
  }

  const allowedTransitions = VALID_TRANSITIONS[currentStatus];
  return allowedTransitions ? allowedTransitions.includes(newStatus) : false;
}

/**
 * Get required permission for status change
 */
function getRequiredPermission(
  currentStatus: string,
  newStatus: string,
  userId: string,
  ownerId: string
): { action: string; context?: any } {
  // Completing a project requires higher permission
  if (newStatus === 'Completed') {
    return {
      action: 'edit_any_project', // Only admins can complete
    };
  }

  // Moving to QA Review requires edit permission
  if (newStatus === 'QA Review') {
    return {
      action: 'edit_any_project',
    };
  }

  // Other status changes can be done by owner or admin
  if (userId === ownerId) {
    return {
      action: 'edit_own_project',
      context: { ownerId },
    };
  }

  return {
    action: 'edit_any_project',
  };
}

/**
 * Handler for PUT /api/projects/update-status
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

    // Validate request body
    let validatedData;
    try {
      validatedData = StatusUpdateSchema.parse(req.body);
    } catch (error: any) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors || error.message,
      });
    }

    const projectId = parseInt(validatedData.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    // Get existing project
    let existingProject: ProjectSharePointItem;
    try {
      existingProject = await ProjectsListService.getItem<ProjectSharePointItem>(projectId);
    } catch (error) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if status transition is valid
    if (!isValidTransition(existingProject.Status, validatedData.status)) {
      return res.status(400).json({
        error: 'Invalid status transition',
        message: `Cannot change status from ${existingProject.Status} to ${validatedData.status}`,
        allowedTransitions: VALID_TRANSITIONS[existingProject.Status],
      });
    }

    // Check permission
    const { action, context } = getRequiredPermission(
      existingProject.Status,
      validatedData.status,
      mockUser.id,
      existingProject.ProjectOwnerId
    );

    const permissionResult = checkPermission(
      mockUser as any,
      action as any,
      context
    );

    if (!permissionResult.allowed) {
      return res.status(403).json({
        error: 'Forbidden',
        message: permissionResult.reason || 'You do not have permission to change this project status',
      });
    }

    // Prepare update data
    const updateData: UpdateItemData<ProjectSharePointItem> = {
      Status: validatedData.status,
    };

    // Update actual dates if provided
    if (validatedData.actualStartDate) {
      updateData.ActualStartDate = validatedData.actualStartDate;
    }

    if (validatedData.actualEndDate) {
      updateData.ActualEndDate = validatedData.actualEndDate;
    }

    // Auto-set actualStartDate when moving to In Progress
    if (validatedData.status === 'In Progress' && !existingProject.ActualStartDate && !validatedData.actualStartDate) {
      updateData.ActualStartDate = new Date().toISOString().split('T')[0];
    }

    // Auto-set actualEndDate when completing
    if (validatedData.status === 'Completed' && !existingProject.ActualEndDate && !validatedData.actualEndDate) {
      updateData.ActualEndDate = new Date().toISOString().split('T')[0];
    }

    // Update project in SharePoint
    await ProjectsListService.updateItem<ProjectSharePointItem>(
      projectId,
      updateData
    );

    // Fetch updated project
    const updatedItem = await ProjectsListService.getItem<ProjectSharePointItem>(projectId);

    return res.status(200).json({
      message: 'Project status updated successfully',
      project: {
        id: updatedItem.Id.toString(),
        projectNumber: updatedItem.ProjectNumber,
        status: updatedItem.Status,
        actualStartDate: updatedItem.ActualStartDate,
        actualEndDate: updatedItem.ActualEndDate,
      },
    });

  } catch (error) {
    console.error('Error updating project status:', error);

    // Handle 404 - project not found
    if (error && typeof error === 'object' && 'statusCode' in error) {
      if ((error as any).statusCode === 404) {
        return res.status(404).json({ error: 'Project not found' });
      }
    }

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to update project status',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to update project status',
      message: 'An unknown error occurred',
    });
  }
}

export default handler;
