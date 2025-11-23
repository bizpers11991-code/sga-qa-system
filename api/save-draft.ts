import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { handleApiError } from './_lib/errors.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { Role } from '../src/types.js';

const DRAFT_EXPIRATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  const { jobId, foremanId, draft } = request.body;
  try {
    const redis = getRedisInstance();

    if (!jobId || !foremanId || !draft) {
      return response.status(400).json({ message: 'Job ID, Foreman ID, and draft data are required.' });
    }
    
    // Security: A foreman can only save drafts for themselves.
    if (request.user.id !== foremanId) {
        return response.status(403).json({ message: 'Forbidden: You can only save your own drafts.' });
    }

    const draftKey = `draft:${jobId}:${foremanId}`;
    
    // Set the draft in Redis with an expiration
    await redis.set(draftKey, JSON.stringify(draft), { ex: DRAFT_EXPIRATION_SECONDS });

    return response.status(200).json({ message: 'Draft saved successfully.' });

  } catch (error: any) {
    await handleApiError({
        res: response,
        error,
        title: 'Save Draft Failure',
        context: { jobId, foremanId },
    });
  }
}


const authorizedRoles: Role[] = ['asphalt_foreman', 'profiling_foreman', 'spray_foreman'];

export default withAuth(handler, authorizedRoles);