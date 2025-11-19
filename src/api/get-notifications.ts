import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { AppNotification, Role } from '../types';
import { handleApiError } from './_lib/errors.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';

async function handler(
  req: AuthenticatedRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const redis = getRedisInstance();
    const notificationIds = await redis.smembers('notifications:index');

    if (notificationIds.length === 0) {
        return res.status(200).json([]);
    }

    const notificationsJson = await redis.mget(...notificationIds.map(id => `notification:${id}`));

    const notifications = notificationsJson
        .filter((n): n is string => n !== null)
        .map(n => JSON.parse(n) as AppNotification)
        .filter(n => !n.isResolved) // Only return unresolved notifications
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.status(200).json(notifications);

  } catch (error: any) {
    await handleApiError({ res, error, title: 'Fetch Notifications Failure' });
  }
}

const authorizedRoles: Role[] = [
    'asphalt_engineer', 'profiling_engineer', 'spray_admin',
    'management_admin', 'scheduler_admin', 'hseq_manager'
];

export default withAuth(handler, authorizedRoles);
