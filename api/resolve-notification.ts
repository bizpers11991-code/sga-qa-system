import type { VercelRequest, VercelResponse } from '@vercel/node';
import { NotificationsData } from './_lib/sharepointData.js';
import { AppNotification, Role } from '../src/types.js';
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

    const notification = await NotificationsData.getById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    // Update notification to mark as resolved
    await NotificationsData.update(notificationId, {
      isResolved: true,
      resolvedBy: resolvedBy,
      resolvedAt: new Date().toISOString(),
    });

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
