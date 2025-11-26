import type { VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { ScopeReport, Project } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError, NotFoundError } from './_lib/errors.js';
import {
  generateScopeReportNumber,
  validateScopeReport,
  updateProjectAfterScopeReport,
  sendScopeReportNotification,
  postScopeReportToTeams,
} from './_lib/scopeReportHandler.js';

const prepareObjectForRedis = (obj: Record<string, any>): Record<string, string> => {
  const prepared: Record<string, string> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] != null) {
      const value = obj[key];
      if (typeof value === 'object') {
        prepared[key] = JSON.stringify(value);
      } else {
        prepared[key] = String(value);
      }
    }
  }
  return prepared;
};

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  const reportData: Partial<ScopeReport> = request.body;

  try {
    const redis = getRedisInstance();

    // Validate scope report data
    validateScopeReport(reportData);

    // Fetch project to get project number
    const projectKey = `project:${reportData.projectId}`;
    const projectHash = await redis.hgetall(projectKey);

    if (!projectHash || Object.keys(projectHash).length === 0) {
      throw new NotFoundError('Project', { projectId: reportData.projectId });
    }

    // Reconstruct project
    const project: Partial<Project> = {};
    for (const [key, value] of Object.entries(projectHash)) {
      try {
        project[key as keyof Project] = JSON.parse(value as string);
      } catch {
        (project as any)[key] = value;
      }
    }

    // Generate report number
    const reportNumber = generateScopeReportNumber(
      (project as Project).projectNumber,
      reportData.visitNumber!
    );
    const reportId = `scopereport-${Date.now()}`;

    // Create complete scope report
    const completeReport: ScopeReport = {
      id: reportId,
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

    // Store scope report in Redis
    const reportKey = `scopereport:${reportId}`;
    const preparedReport = prepareObjectForRedis(completeReport);

    const pipeline = redis.pipeline();
    pipeline.hset(reportKey, preparedReport);
    pipeline.sadd('scopereports:index', reportId);

    await pipeline.exec();

    // Respond to user immediately
    response.status(201).json({
      success: true,
      message: `Scope report ${reportNumber} submitted successfully`,
      report: completeReport,
    });

    // --- Asynchronous Post-Submission Tasks ---

    // 1. Update project with report
    updateProjectAfterScopeReport(reportData.projectId!, reportId).catch(err => {
      console.error(`[Non-blocking] Failed to update project after scope report:`, err);
    });

    // 2. Send notification to project owner
    sendScopeReportNotification(completeReport, project as Project).catch(err => {
      console.error(`[Non-blocking] Failed to send scope report notification:`, err);
    });

    // 3. Post summary to Teams
    postScopeReportToTeams(completeReport, project as Project).catch(err => {
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
