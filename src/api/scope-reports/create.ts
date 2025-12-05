/**
 * @file src/api/scope-reports/create.ts
 * @description POST /api/scope-reports/create - Create new scope report
 * Validates input, auto-generates report number, handles photo uploads
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ScopeReportsListService, PhotosService } from '@/lib/sharepoint';
import { checkPermission } from '@/lib/auth/permissions';
import { ScopeReportCreateSchema } from '@/lib/validation/schemas';
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
 * Generate scope report number in format: SR-YYYY-NNNN
 */
async function generateReportNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SR-${year}-`;

  // Get all scope reports from this year
  const filter = `startswith(ReportNumber, '${prefix}')`;
  const reports = await ScopeReportsListService.getItems<ScopeReportSharePointItem>({
    filter,
    select: ['ReportNumber'],
    orderBy: 'ReportNumber',
    orderByDescending: true,
    top: 1,
  });

  if (reports.length === 0) {
    return `${prefix}0001`;
  }

  // Extract number and increment
  const lastNumber = reports[0].ReportNumber.split('-')[2];
  const nextNumber = (parseInt(lastNumber, 10) + 1).toString().padStart(4, '0');

  return `${prefix}${nextNumber}`;
}

/**
 * Upload photos to SharePoint Photos library
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
      const result = await PhotosService.uploadFile(buffer, photo.fileName, {
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
 * Handler for POST /api/scope-reports/create
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
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

    // Check create_scope_report permission
    const permissionResult = checkPermission(mockUser as any, 'create_scope_report');

    if (!permissionResult.allowed) {
      return res.status(403).json({
        error: 'Forbidden',
        reason: permissionResult.reason,
      });
    }

    // Extract photo uploads from body (if provided separately)
    const { photoUploads, ...reportData } = req.body;

    // Validate request body
    const validationResult = ScopeReportCreateSchema.safeParse(reportData);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const data = validationResult.data;

    // Generate report number
    const reportNumber = await generateReportNumber();

    // Handle photo uploads if provided
    let uploadedPhotos: Array<{ fileName: string; url: string }> = [];
    if (photoUploads && Array.isArray(photoUploads) && photoUploads.length > 0) {
      uploadedPhotos = await uploadPhotos(reportNumber, photoUploads);
    }

    // Map to SharePoint fields
    const spData = {
      Title: reportNumber, // Title is required by SharePoint
      ReportNumber: reportNumber,
      ProjectId: data.projectId,
      VisitNumber: data.visitNumber,
      VisitType: data.visitType,
      ScheduledDate: data.scheduledDate,
      ActualDate: data.actualDate,
      CompletedBy: data.completedBy,
      SiteAccessibility: JSON.stringify(data.siteAccessibility),
      SurfaceCondition: JSON.stringify(data.surfaceCondition),
      Measurements: JSON.stringify(data.measurements),
      TrafficManagement: JSON.stringify(data.trafficManagement),
      Utilities: JSON.stringify(data.utilities),
      Hazards: JSON.stringify(data.hazards),
      Recommendations: data.recommendations,
      EstimatedDuration: data.estimatedDuration,
      Photos: JSON.stringify([...data.photos, ...uploadedPhotos]),
      Documents: data.documents ? JSON.stringify(data.documents) : undefined,
      Signature: data.signature,
      SignedAt: data.signedAt,
      Status: 'Draft',
    };

    // Create in SharePoint
    const createdItem = await ScopeReportsListService.createItem<ScopeReportSharePointItem>(spData);

    // Map back to frontend format
    const scopeReport = {
      id: createdItem.Id.toString(),
      reportNumber: createdItem.ReportNumber,
      projectId: createdItem.ProjectId,
      visitNumber: createdItem.VisitNumber,
      visitType: createdItem.VisitType,
      scheduledDate: createdItem.ScheduledDate,
      actualDate: createdItem.ActualDate,
      completedBy: createdItem.CompletedBy,
      siteAccessibility: JSON.parse(createdItem.SiteAccessibility),
      surfaceCondition: JSON.parse(createdItem.SurfaceCondition),
      measurements: JSON.parse(createdItem.Measurements),
      trafficManagement: JSON.parse(createdItem.TrafficManagement),
      utilities: JSON.parse(createdItem.Utilities),
      hazards: JSON.parse(createdItem.Hazards),
      recommendations: createdItem.Recommendations,
      estimatedDuration: createdItem.EstimatedDuration,
      photos: JSON.parse(createdItem.Photos),
      documents: createdItem.Documents ? JSON.parse(createdItem.Documents) : [],
      signature: createdItem.Signature,
      signedAt: createdItem.SignedAt,
      status: createdItem.Status,
    };

    return res.status(201).json({
      message: 'Scope report created successfully',
      scopeReport,
      uploadedPhotos,
    });
  } catch (error) {
    console.error('Error creating scope report:', error);

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to create scope report',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to create scope report',
      message: 'An unknown error occurred',
    });
  }
}

export default handler;
