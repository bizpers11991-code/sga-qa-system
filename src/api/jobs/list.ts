/**
 * @file src/api/jobs/list.ts
 * @description GET /api/jobs/list - Get all jobs with optional filters and pagination
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
 * Maps SharePoint columns to our Job type
 */
interface SharePointJobItem extends SharePointListItem {
  Title: string; // Job number
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
  RequiredQAForms?: string; // JSON string
  ProjectId?: string;
  AssignedCrewId?: string;
  JobSheetData?: string; // JSON string
  AsphaltDetails?: string; // JSON string
  ProfilingDetails?: string; // JSON string
  SiteVisitEventIds?: string; // JSON string
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
 * Build OData filter from query parameters
 */
function buildFilter(query: any): string | undefined {
  const filters: string[] = [];

  if (query.division) {
    filters.push(`Division eq '${query.division}'`);
  }

  if (query.foremanId) {
    filters.push(`ForemanId eq '${query.foremanId}'`);
  }

  if (query.status) {
    filters.push(`Status eq '${query.status}'`);
  }

  if (query.client) {
    filters.push(`Client eq '${query.client}'`);
  }

  if (query.projectId) {
    filters.push(`ProjectId eq '${query.projectId}'`);
  }

  if (query.startDate) {
    filters.push(`JobDate ge '${query.startDate}'`);
  }

  if (query.endDate) {
    filters.push(`JobDate le '${query.endDate}'`);
  }

  return filters.length > 0 ? filters.join(' and ') : undefined;
}

/**
 * Handler for GET /api/jobs/list
 */
async function handler(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<void | VercelResponse> {
  try {
    // Check permission
    const permResult = checkPermission(req.user, 'view_job');
    if (!permResult.allowed) {
      return res.status(403).json({
        error: 'Permission denied',
        message: permResult.reason
      });
    }

    // Parse pagination parameters
    const top = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : 0;

    // Build filter from query parameters
    const filter = buildFilter(req.query);

    // Get jobs from SharePoint
    const spItems = await JobsListService.getItems<SharePointJobItem>({
      filter,
      orderBy: req.query.orderBy as string || 'DueDate',
      orderByDescending: req.query.orderDesc === 'true',
      top,
      skip,
    });

    // Map SharePoint items to Job type
    const jobs = spItems.map(mapSharePointItemToJob);

    // Return jobs sorted by due date (client expects this)
    jobs.sort((a, b) => {
      const dateA = new Date(a.dueDate || 0).getTime();
      const dateB = new Date(b.dueDate || 0).getTime();
      return dateA - dateB;
    });

    return res.status(200).json(jobs);
  } catch (error: any) {
    console.error('Error fetching jobs from SharePoint:', error);
    return res.status(500).json({
      error: 'Failed to fetch jobs',
      message: error.message || 'An error occurred while fetching jobs'
    });
  }
}

// Export with auth middleware
// No specific role requirements - permission check handles access control
export default withAuth(handler, []);
