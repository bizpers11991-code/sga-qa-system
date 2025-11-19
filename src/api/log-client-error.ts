import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendErrorNotification } from './_lib/teams.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { message, stack, context } = req.body;

    const error = new Error(message);
    error.stack = stack;

    // Log to server console for Vercel logs
    console.error('[Client-Side Error]', { message, stack, context });

    // Send a notification for monitoring
    await sendErrorNotification('Client-Side Error', error, context);

    res.status(200).json({ message: 'Error logged successfully.' });
  } catch (e: any) {
    // This endpoint should not fail publicly. Just log the meta-error.
    console.error('Failed to log client-side error:', e.message);
    res.status(500).json({ message: 'Failed to process log.' });
  }
}
