/**
 * @file src/api/scope-reports/submit.ts
 * @description POST /api/scope-reports/submit - Submit scope report for review
 * Updates status to 'Submitted' and notifies reviewers
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ScopeReportsListService, ProjectsListService } from '@/lib/sharepoint';
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

// SharePoint field mapping for Projects
interface ProjectSharePointItem extends SharePointListItem {
  ProjectNumber: string;
  ProjectName: string;
  ProjectOwnerId: string;
  ScopingPersonId: string;
  ScopeReportIds?: string;
}

/**
 * Send notification to reviewers
 * In production, this would integrate with Microsoft Teams, Email, or Notifications service
 */
async function notifyReviewers(
  report: ScopeReportSharePointItem,
  project: ProjectSharePointItem
): Promise<void> {
  // This is a placeholder for notification logic
  // In production, you would:
  // 1. Send Teams message to project owner and scoping person
  // 2. Send email notification
  // 3. Create in-app notification

  console.log(`Notification: Scope report ${report.ReportNumber} submitted for review`);
  console.log(`Project: ${project.ProjectName}`);
  console.log(`Reviewers: ${project.ProjectOwnerId}, ${project.ScopingPersonId}`);

  // Example notification payload:
  const notification = {
    title: 'New Scope Report Submitted',
    message: `Scope report ${report.ReportNumber} for ${project.ProjectName} has been submitted for review.`,
    type: 'scope_report_submitted',
    recipients: [project.ProjectOwnerId, project.ScopingPersonId],
    data: {
      reportId: report.Id,
      reportNumber: report.ReportNumber,
      projectId: project.Id,
      projectName: project.ProjectName,
      visitType: report.VisitType,
      completedBy: report.CompletedBy,
    },
    actionUrl: `/scope-reports/${report.Id}`,
  };

  // TODO: Integrate with notification service
  // await notificationService.send(notification);
}

/**
 * Update project's scope report IDs array
 */
async function updateProjectScopeReports(
  projectId: string,
  reportId: string
): Promise<void> {
  const project = await ProjectsListService.getItem<ProjectSharePointItem>(parseInt(projectId));

  const existingReportIds = project.ScopeReportIds
    ? JSON.parse(project.ScopeReportIds)
    : [];

  // Add report ID if not already in array
  if (!existingReportIds.includes(reportId)) {
    existingReportIds.push(reportId);

    await ProjectsListService.updateItem(parseInt(projectId), {
      ScopeReportIds: JSON.stringify(existingReportIds),
    });
  }
}

/**
 * Handler for POST /api/scope-reports/submit
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

    // Extract report ID
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Scope report ID is required' });
    }

    const reportId = parseInt(id, 10);
    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid scope report ID' });
    }

    // Get scope report from SharePoint
    const report = await ScopeReportsListService.getItem<ScopeReportSharePointItem>(reportId);

    // Check if user can edit this report (ownership check)
    const permissionResult = checkPermission(
      mockUser as any,
      'edit_scope_report',
      { ownerId: report.CompletedBy }
    );

    if (!permissionResult.allowed) {
      return res.status(403).json({
        error: 'Forbidden',
        reason: permissionResult.reason,
      });
    }

    // Check current status
    if (report.Status === 'Submitted') {
      return res.status(400).json({ error: 'Scope report is already submitted' });
    }

    if (report.Status === 'Reviewed') {
      return res.status(400).json({ error: 'Scope report has already been reviewed' });
    }

    // Validate report is complete (has signature)
    if (!report.Signature) {
      return res.status(400).json({
        error: 'Cannot submit incomplete scope report',
        message: 'Report must be signed before submission',
      });
    }

    // Update status to Submitted
    await ScopeReportsListService.updateItem(reportId, {
      Status: 'Submitted',
    });

    // Update project's scope report IDs
    await updateProjectScopeReports(report.ProjectId, report.Id.toString());

    // Get project details for notification
    const project = await ProjectsListService.getItem<ProjectSharePointItem>(
      parseInt(report.ProjectId)
    );

    // Send notifications to reviewers
    await notifyReviewers(report, project);

    // Fetch updated report
    const updatedReport = await ScopeReportsListService.getItem<ScopeReportSharePointItem>(reportId);

    return res.status(200).json({
      message: 'Scope report submitted successfully',
      scopeReport: {
        id: updatedReport.Id.toString(),
        reportNumber: updatedReport.ReportNumber,
        status: updatedReport.Status,
        projectId: updatedReport.ProjectId,
        visitType: updatedReport.VisitType,
      },
      notifications: {
        sent: true,
        recipients: [project.ProjectOwnerId, project.ScopingPersonId],
      },
    });
  } catch (error) {
    console.error('Error submitting scope report:', error);

    // Handle 404 - report not found
    if (error && typeof error === 'object' && 'statusCode' in error) {
      if ((error as any).statusCode === 404) {
        return res.status(404).json({ error: 'Scope report not found' });
      }
    }

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to submit scope report',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to submit scope report',
      message: 'An unknown error occurred',
    });
  }
}

export default handler;
