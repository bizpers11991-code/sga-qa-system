import type { VercelResponse } from '@vercel/node';
import { ScopeReportsData } from './_lib/sharepointData';
import { withAuth, AuthenticatedRequest } from './_lib/auth';
import { handleApiError, NotFoundError } from './_lib/errors';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  try {
    // Get scope report ID from query parameter
    const { id } = request.query;

    if (!id || typeof id !== 'string') {
      throw new NotFoundError('Scope Report', { providedId: id });
    }

    // Fetch scope report from SharePoint
    const report = await ScopeReportsData.getById(id);

    if (!report) {
      throw new NotFoundError('Scope Report', { reportId: id });
    }

    return response.status(200).json(report);

  } catch (error: any) {
    await handleApiError({
      res: response,
      error,
      title: 'Get Scope Report Failure',
      context: {
        reportId: request.query.id,
        authenticatedUserId: request.user.id,
      },
    });
  }
}

// Any authenticated user can view a scope report
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
