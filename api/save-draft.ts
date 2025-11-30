import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DraftsData } from './_lib/sharepointData';
import { handleApiError } from './_lib/errors.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { Role } from '../src/types.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  const { jobId, foremanId, draft } = request.body;
  try {
    if (!jobId || !foremanId || !draft) {
      return response.status(400).json({ message: 'Job ID, Foreman ID, and draft data are required.' });
    }

    // Security: A foreman can only save drafts for themselves.
    if (request.user.id !== foremanId) {
        return response.status(403).json({ message: 'Forbidden: You can only save your own drafts.' });
    }

    // Check if draft already exists
    const existingDrafts = await DraftsData.getAll(`JobId eq '${jobId}' and ForemanId eq '${foremanId}'`);

    if (existingDrafts.length > 0) {
      // Update existing draft
      await DraftsData.update(existingDrafts[0].id!, {
        jobId,
        foremanId,
        draftData: draft,
        lastModified: new Date().toISOString(),
      });
    } else {
      // Create new draft
      await DraftsData.create({
        jobId,
        foremanId,
        draftData: draft,
        lastModified: new Date().toISOString(),
      });
    }

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