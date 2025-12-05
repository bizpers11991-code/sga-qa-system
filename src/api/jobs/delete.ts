/**
 * @file src/api/jobs/delete.ts
 * @description DELETE /api/jobs/delete - Delete job
 * Uses SharePoint integration layer instead of Redis
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { JobsListService } from '@/lib/sharepoint';
import { checkPermission } from '@/lib/auth/permissions';
import { withAuth, AuthenticatedRequest } from '@/api/_lib/auth';
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
 * Handler for DELETE /api/jobs/delete
 */
async function handler(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<void | VercelResponse> {
  try {
    // Only accept DELETE requests
    if (req.method !== 'DELETE') {
      return res.status(405).json({
        error: 'Method not allowed',
        message: 'Only DELETE requests are accepted'
      });
    }

    // Get job ID from query parameter or body
    const jobId = (req.query.id as string) || req.body?.id;

    if (!jobId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Job ID is required'
      });
    }

    // Check permission - only users with delete_job permission can delete
    const permResult = checkPermission(req.user, 'delete_job');
    if (!permResult.allowed) {
      return res.status(403).json({
        error: 'Permission denied',
        message: permResult.reason || 'You do not have permission to delete jobs'
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

    // Verify job exists before attempting deletion
    try {
      await JobsListService.getItem<SharePointJobItem>(sharePointId);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Job not found'
        });
      }
      throw error;
    }

    // Delete job from SharePoint
    await JobsListService.deleteItem(sharePointId);

    return res.status(200).json({
      message: 'Job deleted successfully',
      jobId
    });
  } catch (error: any) {
    console.error('Error deleting job from SharePoint:', error);

    // Handle 404 specifically
    if (error.statusCode === 404) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Job not found'
      });
    }

    // Handle permission errors from SharePoint
    if (error.statusCode === 403) {
      return res.status(403).json({
        error: 'Permission denied',
        message: 'Unable to delete job - insufficient permissions in SharePoint'
      });
    }

    return res.status(500).json({
      error: 'Failed to delete job',
      message: error.message || 'An error occurred while deleting the job'
    });
  }
}

// Export with auth middleware
export default withAuth(handler, []);
