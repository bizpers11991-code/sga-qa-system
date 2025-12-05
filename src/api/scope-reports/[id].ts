/**
 * @file src/api/scope-reports/[id].ts
 * @description GET /api/scope-reports/[id] - Get single scope report by ID
 * Includes documents and photos
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ScopeReportsListService, PhotosService } from '@/lib/sharepoint';
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
 * Handler for GET /api/scope-reports/[id]
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract report ID from query
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Scope report ID is required' });
    }

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

    // Get scope report from SharePoint
    const reportId = parseInt(id);
    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid scope report ID' });
    }

    const spItem = await ScopeReportsListService.getItem<ScopeReportSharePointItem>(reportId);
    const scopeReport = mapSharePointToScopeReport(spItem);

    // Optionally fetch photo details
    const includePhotos = req.query.includePhotos === 'true';
    const response: any = { scopeReport };

    if (includePhotos && scopeReport.photos.length > 0) {
      try {
        // Get photo metadata from Photos library
        const folderPath = `ScopeReports/${scopeReport.reportNumber}`;
        const photoFiles = await PhotosService.listFiles(folderPath);

        response.photoDetails = photoFiles.map((file: any) => ({
          fileName: file.Name,
          url: file.ServerRelativeUrl,
          size: file.Length,
          modified: file.TimeLastModified,
        }));
      } catch (error) {
        console.error('Error fetching photo details:', error);
        response.photoDetails = [];
      }
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching scope report:', error);

    // Handle 404 - report not found
    if (error && typeof error === 'object' && 'statusCode' in error) {
      if ((error as any).statusCode === 404) {
        return res.status(404).json({ error: 'Scope report not found' });
      }
    }

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to fetch scope report',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to fetch scope report',
      message: 'An unknown error occurred',
    });
  }
}

export default handler;
