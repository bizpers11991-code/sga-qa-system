/**
 * @file src/api/scope-reports/update.ts
 * @description PUT /api/scope-reports/update - Update existing scope report
 * Updates scope report details and metadata
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ScopeReportsListService, PhotosService } from '@/lib/sharepoint';
import { checkPermission } from '@/lib/auth/permissions';
import { ScopeReportUpdateSchema } from '@/lib/validation/schemas';
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
 * Upload additional photos to SharePoint Photos library
 */
async function uploadPhotos(
  reportNumber: string,
  photos: Array<{ fileName: string; data: string }> // Base64 encoded
): Promise<Array<{ fileName: string; url: string }>> {
  const uploadedPhotos = [];
  const folderPath = `ScopeReports/${reportNumber}`;

  for (const photo of photos) {
    try {
      // Convert base64 to buffer
      const buffer = Buffer.from(photo.data, 'base64');

      // Upload to SharePoint
      await PhotosService.uploadFile(buffer, photo.fileName, {
        folderPath,
        overwrite: true,
        metadata: {
          ReportNumber: reportNumber,
          UploadedAt: new Date().toISOString(),
        },
      });

      uploadedPhotos.push({
        fileName: photo.fileName,
        url: PhotosService.getFileUrl(photo.fileName, folderPath),
      });
    } catch (error) {
      console.error(`Error uploading photo ${photo.fileName}:`, error);
      // Continue with other photos
    }
  }

  return uploadedPhotos;
}

/**
 * Handler for PUT /api/scope-reports/update
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') {
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

    // Extract report ID and photo uploads
    const { id, photoUploads, ...updateData } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Scope report ID is required' });
    }

    const reportId = parseInt(id, 10);
    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid scope report ID' });
    }

    // Get existing report to check ownership
    const existingReport = await ScopeReportsListService.getItem<ScopeReportSharePointItem>(reportId);

    // Check edit_scope_report permission
    const permissionResult = checkPermission(
      mockUser as any,
      'edit_scope_report',
      { ownerId: existingReport.CompletedBy }
    );

    if (!permissionResult.allowed) {
      return res.status(403).json({
        error: 'Forbidden',
        reason: permissionResult.reason,
      });
    }

    // Validate update data
    const validationResult = ScopeReportUpdateSchema.safeParse(updateData);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const data = validationResult.data;

    // Handle additional photo uploads if provided
    let uploadedPhotos: Array<{ fileName: string; url: string }> = [];
    if (photoUploads && Array.isArray(photoUploads) && photoUploads.length > 0) {
      uploadedPhotos = await uploadPhotos(existingReport.ReportNumber, photoUploads);
    }

    // Map to SharePoint fields
    const spUpdateData: any = {};

    if (data.projectId !== undefined) spUpdateData.ProjectId = data.projectId;
    if (data.visitNumber !== undefined) spUpdateData.VisitNumber = data.visitNumber;
    if (data.visitType !== undefined) spUpdateData.VisitType = data.visitType;
    if (data.scheduledDate !== undefined) spUpdateData.ScheduledDate = data.scheduledDate;
    if (data.actualDate !== undefined) spUpdateData.ActualDate = data.actualDate;
    if (data.completedBy !== undefined) spUpdateData.CompletedBy = data.completedBy;
    if (data.siteAccessibility !== undefined) spUpdateData.SiteAccessibility = JSON.stringify(data.siteAccessibility);
    if (data.surfaceCondition !== undefined) spUpdateData.SurfaceCondition = JSON.stringify(data.surfaceCondition);
    if (data.measurements !== undefined) spUpdateData.Measurements = JSON.stringify(data.measurements);
    if (data.trafficManagement !== undefined) spUpdateData.TrafficManagement = JSON.stringify(data.trafficManagement);
    if (data.utilities !== undefined) spUpdateData.Utilities = JSON.stringify(data.utilities);
    if (data.hazards !== undefined) spUpdateData.Hazards = JSON.stringify(data.hazards);
    if (data.recommendations !== undefined) spUpdateData.Recommendations = data.recommendations;
    if (data.estimatedDuration !== undefined) spUpdateData.EstimatedDuration = data.estimatedDuration;
    if (data.signature !== undefined) spUpdateData.Signature = data.signature;
    if (data.signedAt !== undefined) spUpdateData.SignedAt = data.signedAt;
    if (data.documents !== undefined) spUpdateData.Documents = JSON.stringify(data.documents);

    // Update photos array if new photos were uploaded
    if (uploadedPhotos.length > 0) {
      const existingPhotos = existingReport.Photos ? JSON.parse(existingReport.Photos) : [];
      spUpdateData.Photos = JSON.stringify([...existingPhotos, ...uploadedPhotos]);
    } else if (data.photos !== undefined) {
      spUpdateData.Photos = JSON.stringify(data.photos);
    }

    // Update in SharePoint
    await ScopeReportsListService.updateItem(reportId, spUpdateData);

    // Fetch updated item
    const updatedItem = await ScopeReportsListService.getItem<ScopeReportSharePointItem>(reportId);

    // Map back to frontend format
    const scopeReport = {
      id: updatedItem.Id.toString(),
      reportNumber: updatedItem.ReportNumber,
      projectId: updatedItem.ProjectId,
      visitNumber: updatedItem.VisitNumber,
      visitType: updatedItem.VisitType,
      scheduledDate: updatedItem.ScheduledDate,
      actualDate: updatedItem.ActualDate,
      completedBy: updatedItem.CompletedBy,
      siteAccessibility: JSON.parse(updatedItem.SiteAccessibility),
      surfaceCondition: JSON.parse(updatedItem.SurfaceCondition),
      measurements: JSON.parse(updatedItem.Measurements),
      trafficManagement: JSON.parse(updatedItem.TrafficManagement),
      utilities: JSON.parse(updatedItem.Utilities),
      hazards: JSON.parse(updatedItem.Hazards),
      recommendations: updatedItem.Recommendations,
      estimatedDuration: updatedItem.EstimatedDuration,
      photos: JSON.parse(updatedItem.Photos),
      documents: updatedItem.Documents ? JSON.parse(updatedItem.Documents) : [],
      signature: updatedItem.Signature,
      signedAt: updatedItem.SignedAt,
      status: updatedItem.Status,
    };

    return res.status(200).json({
      message: 'Scope report updated successfully',
      scopeReport,
      uploadedPhotos,
    });
  } catch (error) {
    console.error('Error updating scope report:', error);

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to update scope report',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to update scope report',
      message: 'An unknown error occurred',
    });
  }
}

export default handler;
