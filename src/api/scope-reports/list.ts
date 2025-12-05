/**
 * @file src/api/scope-reports/list.ts
 * @description GET /api/scope-reports/list - Get all scope reports
 * Supports filtering by project and pagination
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ScopeReportsListService } from '@/lib/sharepoint';
import { checkPermission } from '@/lib/auth/permissions';
import type { SharePointListItem } from '@/lib/sharepoint/types';

// SharePoint field mapping for Scope Reports
interface ScopeReportSharePointItem extends SharePointListItem {
  ReportNumber: string;
  ProjectId: string;
  VisitNumber: number;
  VisitType: '14-Day' | '7-Day' | '3-Day' | '72-Hour';
  ScheduledDate: string;
  ActualDate: string;
  CompletedBy: string;
  SiteAccessibility: string; // JSON string
  SurfaceCondition: string; // JSON string
  Measurements: string; // JSON string
  TrafficManagement: string; // JSON string
  Utilities: string; // JSON string
  Hazards: string; // JSON string
  Recommendations: string;
  EstimatedDuration: number;
  Photos: string; // JSON string
  Documents: string; // JSON string
  Signature: string;
  SignedAt: string;
  Status: 'Draft' | 'Submitted' | 'Reviewed';
}

/**
 * Map SharePoint item to frontend Scope Report type
 */
function mapSharePointToScopeReport(spItem: ScopeReportSharePointItem) {
  return {
    id: spItem.Id.toString(),
    reportNumber: spItem.ReportNumber,
    projectId: spItem.ProjectId,
    visitNumber: spItem.VisitNumber,
    visitType: spItem.VisitType,
    scheduledDate: spItem.ScheduledDate,
    actualDate: spItem.ActualDate,
    completedBy: spItem.CompletedBy,
    siteAccessibility: spItem.SiteAccessibility ? JSON.parse(spItem.SiteAccessibility) : {},
    surfaceCondition: spItem.SurfaceCondition ? JSON.parse(spItem.SurfaceCondition) : {},
    measurements: spItem.Measurements ? JSON.parse(spItem.Measurements) : {},
    trafficManagement: spItem.TrafficManagement ? JSON.parse(spItem.TrafficManagement) : {},
    utilities: spItem.Utilities ? JSON.parse(spItem.Utilities) : {},
    hazards: spItem.Hazards ? JSON.parse(spItem.Hazards) : {},
    recommendations: spItem.Recommendations,
    estimatedDuration: spItem.EstimatedDuration,
    photos: spItem.Photos ? JSON.parse(spItem.Photos) : [],
    documents: spItem.Documents ? JSON.parse(spItem.Documents) : [],
    signature: spItem.Signature,
    signedAt: spItem.SignedAt,
    status: spItem.Status,
  };
}

/**
 * Handler for GET /api/scope-reports/list
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Auth check
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock user for now - in production, extract from token
    const mockUser = {
      id: 'user-123',
      role: 'asphalt_engineer' as any,
    };

    // Check view_scope_report permission
    const permissionResult = checkPermission(mockUser as any, 'view_scope_report');

    if (!permissionResult.allowed) {
      return res.status(403).json({
        error: 'Forbidden',
        reason: permissionResult.reason,
      });
    }

    // Extract query parameters
    const { projectId, limit, offset } = req.query;

    // Build filter
    let filter: string | undefined;
    if (projectId && typeof projectId === 'string') {
      filter = `ProjectId eq '${projectId}'`;
    }

    // Parse pagination params
    const top = limit ? parseInt(limit as string, 10) : 50;
    const skip = offset ? parseInt(offset as string, 10) : 0;

    // Get scope reports from SharePoint
    const reports = await ScopeReportsListService.getItems<ScopeReportSharePointItem>({
      filter,
      orderBy: 'ActualDate',
      orderByDescending: true,
      top,
      skip,
    });

    // Map to frontend format
    const mappedReports = reports.map(mapSharePointToScopeReport);

    return res.status(200).json({
      scopeReports: mappedReports,
      count: mappedReports.length,
      hasMore: mappedReports.length === top,
    });
  } catch (error) {
    console.error('Error fetching scope reports:', error);

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to fetch scope reports',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to fetch scope reports',
      message: 'An unknown error occurred',
    });
  }
}

export default handler;
