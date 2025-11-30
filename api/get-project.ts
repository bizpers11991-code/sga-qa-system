import type { VercelResponse } from '@vercel/node';
import { ProjectsData, JobsData, ScopeReportsData, DivisionRequestsData, QAPacksData, NCRsData, IncidentsData } from './_lib/sharepointData.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError, NotFoundError } from './_lib/errors.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  try {
    const { id } = request.query;

    if (!id || typeof id !== 'string') {
      throw new NotFoundError('Project', { providedId: id });
    }

    // Fetch project from SharePoint
    const project = await ProjectsData.getById(id);

    if (!project) {
      throw new NotFoundError('Project', { projectId: id });
    }

    // Fetch all related data in parallel
    const [jobs, scopeReports, divisionRequests, qaPacks, ncrs, incidents] = await Promise.all([
      JobsData.getAll({ projectId: id }),
      ScopeReportsData.getAll(id),
      DivisionRequestsData.getAll({ projectId: id }),
      QAPacksData.getAll(`ProjectId eq '${id}'`),
      NCRsData.getAll(`ProjectId eq '${id}'`),
      IncidentsData.getAll(`ProjectId eq '${id}'`),
    ]);

    return response.status(200).json({
      project,
      jobs,
      scopeReports,
      qaPacks,
      ncrs,
      incidents,
      divisionRequests,
    });

  } catch (error: any) {
    await handleApiError({
      res: response,
      error,
      title: 'Get Project Failure',
      context: {
        projectId: request.query.id,
        authenticatedUserId: request.user.id,
      },
    });
  }
}

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
