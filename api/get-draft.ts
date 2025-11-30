import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DraftsData } from './_lib/sharepointData';
import { handleApiError } from './_lib/errors.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { Role } from '../src/types.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  if (request.method !== 'GET') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  const { jobId, foremanId } = request.query;

  try {
    if (!jobId || !foremanId) {
      return response.status(400).json({ message: 'Job ID and Foreman ID are required.' });
    }

    // Security: A foreman can only get drafts for themselves.
    if (request.user.id !== foremanId) {
        return response.status(403).json({ message: 'Forbidden: You can only access your own drafts.' });
    }

    // Get all drafts and filter by jobId and foremanId
    const allDrafts = await DraftsData.getAll(`JobId eq '${jobId}' and ForemanId eq '${foremanId}'`);

    if (allDrafts.length > 0) {
      return response.status(200).json({ draft: allDrafts[0].draftData });
    } else {
      return response.status(404).json({ message: 'No draft found.' });
    }

  } catch (error: any) {
    await handleApiError({
        res: response,
        error,
        title: 'Fetch Draft Failure',
        context: { jobId, foremanId },
    });
  }
}

const authorizedRoles: Role[] = ['asphalt_foreman', 'profiling_foreman', 'spray_foreman'];

export default withAuth(handler, authorizedRoles);