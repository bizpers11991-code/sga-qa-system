import type { VercelResponse } from '@vercel/node';
import { ScopeReportsData, ProjectsData } from './_lib/sharepointData';
import { ScopeReport, Project } from '../src/types';
import { withAuth, AuthenticatedRequest } from './_lib/auth';
import { handleApiError, NotFoundError } from './_lib/errors';
import {
  generateScopeReportNumber,
  validateScopeReport,
  updateProjectAfterScopeReport,
  sendScopeReportNotification,
  postScopeReportToTeams,
} from './_lib/scopeReportHandler';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  const reportData: Partial<ScopeReport> = request.body;

  try {
    // Validate scope report data
    validateScopeReport(reportData);

    // Fetch project to get project number
    const project = await ProjectsData.getById(reportData.projectId!);

    if (!project) {
      throw new NotFoundError('Project', { projectId: reportData.projectId });
    }

    // Generate report number
    const reportNumber = generateScopeReportNumber(
      project.projectNumber,
      reportData.visitNumber!
    );

    // Create complete scope report
    const completeReportData: Omit<ScopeReport, 'id'> = {
      reportNumber,
      projectId: reportData.projectId!,
      visitNumber: reportData.visitNumber!,
      visitType: reportData.visitType!,
      scheduledDate: reportData.scheduledDate!,
      actualDate: reportData.actualDate!,
      completedBy: request.user.id,
      siteAccessibility: reportData.siteAccessibility!,
      surfaceCondition: reportData.surfaceCondition!,
      measurements: reportData.measurements!,
      trafficManagement: reportData.trafficManagement!,
      utilities: reportData.utilities!,
      hazards: reportData.hazards!,
      recommendations: reportData.recommendations!,
      estimatedDuration: reportData.estimatedDuration!,
      photos: reportData.photos || [],
      documents: reportData.documents,
      signature: reportData.signature!,
      signedAt: reportData.signedAt!,
      status: 'Submitted',
    };

    // Store scope report in SharePoint
    const completeReport = await ScopeReportsData.create(completeReportData);

    // Respond to user immediately
    response.status(201).json({
      success: true,
      message: `Scope report ${reportNumber} submitted successfully`,
      report: completeReport,
    });

    // --- Asynchronous Post-Submission Tasks ---

    // 1. Update project with report
    updateProjectAfterScopeReport(reportData.projectId!, completeReport.id).catch(err => {
      console.error(`[Non-blocking] Failed to update project after scope report:`, err);
    });

    // 2. Send notification to project owner
    sendScopeReportNotification(completeReport, project).catch(err => {
      console.error(`[Non-blocking] Failed to send scope report notification:`, err);
    });

    // 3. Post summary to Teams
    postScopeReportToTeams(completeReport, project).catch(err => {
      console.error(`[Non-blocking] Failed to post scope report to Teams:`, err);
    });

    // 4. Generate PDF (background task)
    // Note: PDF generation would be triggered separately via generate-scope-report-pdf endpoint

  } catch (error: any) {
    await handleApiError({
      res: response,
      error,
      title: 'Submit Scope Report Failure',
      context: {
        projectId: reportData.projectId,
        visitNumber: reportData.visitNumber,
        authenticatedUserId: request.user.id,
      },
    });
  }
}

// Any authenticated user (scoping person) can submit scope reports
export default withAuth(handler, [
  'tender_admin',
  'scheduler_admin',
  'management_admin',
  'hseq_manager',
  'asphalt_engineer',
  'profiling_engineer',
  'spray_admin',
  'asphalt_foreman',
  'profiling_foreman',
  'spray_foreman',
]);
