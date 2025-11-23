// api/get-report-history.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { FinalQaPack, Role } from '../src/types';
import { migrateReport } from './_lib/migration.js';
import { handleApiError } from './_lib/errors.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  if (request.method !== 'GET') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  const { jobNo } = request.query;
  if (!jobNo || typeof jobNo !== 'string') {
    return response.status(400).json({ message: 'Job Number is required.' });
  }
  
  try {
    const redis = getRedisInstance();
    const historyKey = `history:${jobNo}`;
    
    // LRANGE 0 -1 gets all items in the list
    const results = await redis.lrange(historyKey, 0, -1);
    
    if (!results || results.length === 0) {
        return response.status(404).json({ message: 'No history found for this job.'});
    }

    const reports: FinalQaPack[] = results.map(res => {
        const reportData = typeof res === 'string' ? JSON.parse(res) : res;
        return migrateReport(reportData);
    });
    
    // The list is already ordered from newest to oldest by LPUSH
    return response.status(200).json(reports);

  } catch (error: any) {
    await handleApiError({
        res: response,
        error,
        title: 'Fetch Report History Failure',
        context: { jobNo },
    });
  }
}

const authorizedRoles: Role[] = [
    'asphalt_foreman', 'profiling_foreman', 'spray_foreman',
    'asphalt_engineer', 'profiling_engineer', 'spray_admin',
    'management_admin', 'scheduler_admin', 'hseq_manager'
];

export default withAuth(handler, authorizedRoles);
