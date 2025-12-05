/**
 * @file src/api/jobs/update.ts
 * @description PUT /api/jobs/update - Update existing job
 * Uses SharePoint integration layer instead of Redis
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { JobsListService } from '@/lib/sharepoint';
import { checkPermission } from '@/lib/auth/permissions';
import { withAuth, AuthenticatedRequest } from '@/api/_lib/auth';
import { JobUpdateSchema } from '@/lib/validation/schemas';
import type { Job } from '@/types';
import type { SharePointListItem } from '@/lib/sharepoint/types';
import { z } from 'zod';

/**
 * SharePoint Job List Item structure
 */
interface SharePointJobItem extends SharePointListItem {
  Title: string;
  JobNumber: string;
  Client: string;
  Division: 'Asphalt' | 'Profiling' | 'Spray';
  ProjectName: string;
  Location: string;
  ForemanId: string;
  JobDate: string;
  DueDate: string;
  Status: string;
  Area?: number;
  Thickness?: number;
  WorkDescription?: string;
  ClientTier?: 'Tier 1' | 'Tier 2' | 'Tier 3';
  QASpec?: string;
  ITpTemplateId?: string;
  RequiredQAForms?: string;
  ProjectId?: string;
  AssignedCrewId?: string;
  JobSheetData?: string;
  AsphaltDetails?: string;
  ProfilingDetails?: string;
  SiteVisitEventIds?: string;
  JobCalendarEventId?: string;
  SchemaVersion?: number;
}

/**
 * Map partial Job update to SharePoint item format
 */
function mapJobUpdateToSharePointItem(jobUpdate: any): Partial<SharePointJobItem> {
  const spItem: Partial<SharePointJobItem> = {};

  // Map only provided fields
  if (jobUpdate.jobNo !== undefined) {
    spItem.JobNumber = jobUpdate.jobNo;
    spItem.Title = jobUpdate.jobNo;
  }
  if (jobUpdate.client !== undefined) spItem.Client = jobUpdate.client;
  if (jobUpdate.division !== undefined) spItem.Division = jobUpdate.division;
  if (jobUpdate.projectName !== undefined) spItem.ProjectName = jobUpdate.projectName;
  if (jobUpdate.location !== undefined) spItem.Location = jobUpdate.location;
  if (jobUpdate.foremanId !== undefined) spItem.ForemanId = jobUpdate.foremanId;
  if (jobUpdate.jobDate !== undefined) spItem.JobDate = jobUpdate.jobDate;
  if (jobUpdate.dueDate !== undefined) spItem.DueDate = jobUpdate.dueDate;
  if (jobUpdate.area !== undefined) spItem.Area = jobUpdate.area;
  if (jobUpdate.thickness !== undefined) spItem.Thickness = jobUpdate.thickness;
  if (jobUpdate.workDescription !== undefined) spItem.WorkDescription = jobUpdate.workDescription;
  if (jobUpdate.clientTier !== undefined) spItem.ClientTier = jobUpdate.clientTier;
  if (jobUpdate.qaSpec !== undefined) spItem.QASpec = jobUpdate.qaSpec;
  if (jobUpdate.itpTemplateId !== undefined) spItem.ITpTemplateId = jobUpdate.itpTemplateId;
  if (jobUpdate.projectId !== undefined) spItem.ProjectId = jobUpdate.projectId;
  if (jobUpdate.assignedCrewId !== undefined) spItem.AssignedCrewId = jobUpdate.assignedCrewId;

  // Handle JSON fields
  if (jobUpdate.requiredQaForms !== undefined) {
    spItem.RequiredQAForms = JSON.stringify(jobUpdate.requiredQaForms);
  }
  if (jobUpdate.jobSheetData !== undefined) {
    spItem.JobSheetData = JSON.stringify(jobUpdate.jobSheetData);
  }
  if (jobUpdate.asphaltDetails !== undefined) {
    spItem.AsphaltDetails = JSON.stringify(jobUpdate.asphaltDetails);
  }
  if (jobUpdate.profilingDetails !== undefined) {
    spItem.ProfilingDetails = JSON.stringify(jobUpdate.profilingDetails);
  }
  if (jobUpdate.siteVisitEventIds !== undefined) {
    spItem.SiteVisitEventIds = JSON.stringify(jobUpdate.siteVisitEventIds);
  }
  if (jobUpdate.jobCalendarEventId !== undefined) {
    spItem.JobCalendarEventId = jobUpdate.jobCalendarEventId;
  }

  return spItem;
}

/**
 * Map SharePoint item to Job type
 */
function mapSharePointItemToJob(spItem: SharePointJobItem): Job {
  return {
    id: `job-${spItem.Id}`,
    jobNo: spItem.JobNumber || spItem.Title,
    client: spItem.Client,
    division: spItem.Division,
    projectName: spItem.ProjectName,
    location: spItem.Location,
    foremanId: spItem.ForemanId,
    jobDate: spItem.JobDate,
    dueDate: spItem.DueDate,
    area: spItem.Area,
    thickness: spItem.Thickness,
    qaSpec: spItem.QASpec,
    requiredQaForms: spItem.RequiredQAForms ? JSON.parse(spItem.RequiredQAForms) : undefined,
    itpTemplateId: spItem.ITpTemplateId,
    projectId: spItem.ProjectId,
    assignedCrewId: spItem.AssignedCrewId,
    jobSheetData: spItem.JobSheetData ? JSON.parse(spItem.JobSheetData) : undefined,
    asphaltDetails: spItem.AsphaltDetails ? JSON.parse(spItem.AsphaltDetails) : undefined,
    profilingDetails: spItem.ProfilingDetails ? JSON.parse(spItem.ProfilingDetails) : undefined,
    siteVisitEventIds: spItem.SiteVisitEventIds ? JSON.parse(spItem.SiteVisitEventIds) : undefined,
    jobCalendarEventId: spItem.JobCalendarEventId,
    clientTier: spItem.ClientTier,
    schemaVersion: spItem.SchemaVersion,
  };
}

/**
 * Extract SharePoint item ID from our job ID format
 */
function extractSharePointId(jobId: string): number {
  const match = jobId.match(/^job-(\d+)$/);
  if (!match) {
    throw new Error('Invalid job ID format. Expected format: job-{number}');
  }
  return parseInt(match[1], 10);
}

/**
 * Handler for PUT /api/jobs/update
 */
async function handler(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<void | VercelResponse> {
  try {
    // Only accept PUT requests
    if (req.method !== 'PUT') {
      return res.status(405).json({
        error: 'Method not allowed',
        message: 'Only PUT requests are accepted'
      });
    }

    // Get job ID from request body
    const { id, ...updateData } = req.body;

    if (!id) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Job ID is required'
      });
    }

    // Extract SharePoint item ID
    let sharePointId: number;
    try {
      sharePointId = extractSharePointId(id);
    } catch (error: any) {
      return res.status(400).json({
        error: 'Bad request',
        message: error.message
      });
    }

    // Get existing job to check ownership
    const existingItem = await JobsListService.getItem<SharePointJobItem>(sharePointId);
    const existingJob = mapSharePointItemToJob(existingItem);

    // Check permissions based on ownership
    // Check if user can edit any job
    const canEditAny = checkPermission(req.user, 'edit_any_job').allowed;

    // If can't edit any job, check if they can edit their own job
    if (!canEditAny) {
      const ownJobPermResult = checkPermission(
        req.user,
        'edit_own_job',
        { ownerId: existingJob.foremanId }
      );

      if (!ownJobPermResult.allowed) {
        return res.status(403).json({
          error: 'Permission denied',
          message: ownJobPermResult.reason || 'You can only edit your own jobs'
        });
      }
    }

    // Validate update data
    let validatedData;
    try {
      validatedData = JobUpdateSchema.parse(updateData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Invalid job data',
          details: error.errors
        });
      }
      throw error;
    }

    // Map to SharePoint format
    const spUpdateData = mapJobUpdateToSharePointItem(validatedData);

    // Update job in SharePoint
    await JobsListService.updateItem<SharePointJobItem>(sharePointId, spUpdateData);

    // Fetch updated job
    const updatedItem = await JobsListService.getItem<SharePointJobItem>(sharePointId);
    const updatedJob = mapSharePointItemToJob(updatedItem);

    return res.status(200).json({
      message: 'Job updated successfully',
      job: updatedJob
    });
  } catch (error: any) {
    console.error('Error updating job in SharePoint:', error);

    // Handle 404 specifically
    if (error.statusCode === 404) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Job not found'
      });
    }

    return res.status(500).json({
      error: 'Failed to update job',
      message: error.message || 'An error occurred while updating the job'
    });
  }
}

// Export with auth middleware
export default withAuth(handler, []);
