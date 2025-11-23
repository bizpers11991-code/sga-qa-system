import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { AppNotification, Role } from '../src/types';
import { handleApiError } from './_lib/errors.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';

async function handler(
  req: AuthenticatedRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { notificationId, resolvedBy } = req.body;
    if (!notificationId || !resolvedBy) {
      return res.status(400).json({ message: 'Notification ID and resolver name are required.' });
    }

    const redis = getRedisInstance();
    const key = `notification:${notificationId}`;

    const notificationJson = await redis.get(key) as string | null;
    if (!notificationJson) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    const notification: AppNotification = JSON.parse(notificationJson);
    notification.isResolved = true;
    notification.resolvedBy = resolvedBy;
    notification.resolvedAt = new Date().toISOString();

    await redis.set(key, JSON.stringify(notification));

    res.status(200).json({ message: 'Notification resolved successfully.' });

  } catch (error: any) {
    await handleApiError({
        res,
        error,
        title: 'Resolve Notification Failure',
        context: { notificationId: req.body.notificationId },
    });
  }
}

const authorizedRoles: Role[] = [
    'asphalt_engineer', 'profiling_engineer', 'spray_admin',
    'management_admin', 'scheduler_admin', 'hseq_manager'
];

export default withAuth(handler, authorizedRoles);
