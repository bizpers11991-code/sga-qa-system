import type { VercelResponse } from '@vercel/node';
import { JobsData } from './_lib/sharepointData.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  const { foremanId } = request.query;

  if (!foremanId || typeof foremanId !== 'string') {
    return response.status(400).json({ message: 'Foreman ID is required.' });
  }

  // Authorization: A user can only request their own jobs
  if (request.user.id !== foremanId) {
    return response.status(403).json({ message: 'Forbidden: You can only access your own jobs.' });
  }

  try {
    // Get jobs from SharePoint filtered by foreman
    const jobs = await JobsData.getByForeman(foremanId);

    // Sort jobs by date, most recent first
    jobs.sort((a, b) => new Date(b.jobDate).getTime() - new Date(a.jobDate).getTime());

    return response.status(200).json(jobs);

  } catch (error: any) {
    await handleApiError({
      res: response,
      error,
      title: 'Fetch Foreman Jobs Failure',
      context: { foremanId, authenticatedUserId: request.user.id },
    });
  }
}

// Any authenticated foreman can access this endpoint
export default withAuth(handler, ['asphalt_foreman', 'profiling_foreman', 'spray_foreman']);
