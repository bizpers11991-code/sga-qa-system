/**
 * @file src/api/jobs/[id].ts
 * @description GET /api/jobs/[id] - Get single job by ID
 * Uses SharePoint integration layer instead of Redis
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { JobsListService } from '@/lib/sharepoint';
import { checkPermission } from '@/lib/auth/permissions';
import { withAuth, AuthenticatedRequest } from '@/api/_lib/auth';
import type { Job } from '@/types';
import type { SharePointListItem } from '@/lib/sharepoint/types';

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
 * job-123 -> 123
 */
function extractSharePointId(jobId: string): number {
  const match = jobId.match(/^job-(\d+)$/);
  if (!match) {
    throw new Error('Invalid job ID format. Expected format: job-{number}');
  }
  return parseInt(match[1], 10);
}

/**
 * Handler for GET /api/jobs/[id]
 */
async function handler(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<void | VercelResponse> {
  try {
    // Get job ID from query parameter
    const jobId = req.query.id as string;

    if (!jobId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Job ID is required'
      });
    }

    // Check permission
    const permResult = checkPermission(req.user, 'view_job');
    if (!permResult.allowed) {
      return res.status(403).json({
        error: 'Permission denied',
        message: permResult.reason
      });
    }

    // Extract SharePoint item ID
    let sharePointId: number;
    try {
      sharePointId = extractSharePointId(jobId);
    } catch (error: any) {
      return res.status(400).json({
        error: 'Bad request',
        message: error.message
      });
    }

    // Get job from SharePoint
    const spItem = await JobsListService.getItem<SharePointJobItem>(sharePointId);

    // Map to Job type
    const job = mapSharePointItemToJob(spItem);

    // Check if user has permission to view this specific job
    // Foremen can only view their own jobs
    const editPermResult = checkPermission(
      req.user,
      'edit_own_job',
      { ownerId: job.foremanId }
    );

    // If user can't edit any job and can't edit their own job, deny access
    const canEditAny = checkPermission(req.user, 'edit_any_job').allowed;
    if (!canEditAny && !editPermResult.allowed && req.user.id !== job.foremanId) {
      return res.status(403).json({
        error: 'Permission denied',
        message: 'You can only view your own jobs'
      });
    }

    return res.status(200).json(job);
  } catch (error: any) {
    console.error('Error fetching job from SharePoint:', error);

    // Handle 404 specifically
    if (error.statusCode === 404) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Job not found'
      });
    }

    return res.status(500).json({
      error: 'Failed to fetch job',
      message: error.message || 'An error occurred while fetching the job'
    });
  }
}

// Export with auth middleware
export default withAuth(handler, []);
