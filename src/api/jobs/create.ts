/**
 * @file src/api/jobs/create.ts
 * @description POST /api/jobs/create - Create new job
 * Uses SharePoint integration layer instead of Redis
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { JobsListService } from '@/lib/sharepoint';
import { checkPermission } from '@/lib/auth/permissions';
import { withAuth, AuthenticatedRequest } from '@/api/_lib/auth';
import { JobCreateSchema } from '@/lib/validation/schemas';
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
 * Map Job data to SharePoint item format
 */
function mapJobToSharePointItem(job: any): Partial<SharePointJobItem> {
  return {
    Title: job.jobNo,
    JobNumber: job.jobNo,
    Client: job.client,
    Division: job.division,
    ProjectName: job.projectName,
    Location: job.location,
    ForemanId: job.foremanId,
    JobDate: job.jobDate,
    DueDate: job.dueDate,
    Status: 'Pending', // New jobs start as Pending
    Area: job.area,
    Thickness: job.thickness,
    WorkDescription: job.workDescription,
    ClientTier: job.clientTier,
    QASpec: job.qaSpec,
    ITpTemplateId: job.itpTemplateId,
    RequiredQAForms: job.requiredQaForms ? JSON.stringify(job.requiredQaForms) : undefined,
    ProjectId: job.projectId,
    AssignedCrewId: job.assignedCrewId,
    SchemaVersion: 1,
  };
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
 * Handler for POST /api/jobs/create
 */
async function handler(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<void | VercelResponse> {
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({
        error: 'Method not allowed',
        message: 'Only POST requests are accepted'
      });
    }

    // Check permission
    const permResult = checkPermission(req.user, 'create_job');
    if (!permResult.allowed) {
      return res.status(403).json({
        error: 'Permission denied',
        message: permResult.reason
      });
    }

    // Validate request body
    let validatedData;
    try {
      validatedData = JobCreateSchema.parse(req.body);
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
    const spItem = mapJobToSharePointItem(validatedData);

    // Create job in SharePoint
    const createdItem = await JobsListService.createItem<SharePointJobItem>(spItem);

    // Map back to Job type
    const job = mapSharePointItemToJob(createdItem);

    return res.status(201).json({
      message: 'Job created successfully',
      job
    });
  } catch (error: any) {
    console.error('Error creating job in SharePoint:', error);

    // Handle specific SharePoint errors
    if (error.statusCode === 409) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A job with this number already exists'
      });
    }

    return res.status(500).json({
      error: 'Failed to create job',
      message: error.message || 'An error occurred while creating the job'
    });
  }
}

// Export with auth middleware
export default withAuth(handler, []);
