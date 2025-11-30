import type { VercelRequest, VercelResponse } from '@vercel/node';
import { NotificationsData } from './_lib/sharepointData.js';
import { AppNotification, Role } from '../src/types.js';
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
    const allNotifications = await NotificationsData.getAll();

    // Filter unresolved notifications and sort by timestamp
    const notifications = allNotifications
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
