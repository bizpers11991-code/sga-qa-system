// api/create-calendar-event.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { createJobCalendarEvent, createSiteVisitEvents } from './_lib/calendar.js';
import { handleApiError } from './_lib/errors.js';
import { Role } from '../types.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { type, ...eventData } = req.body;

        if (type === 'job') {
            // Create calendar event for a job assignment
            const eventId = await createJobCalendarEvent(eventData);
            return res.status(200).json({
                success: true,
                eventId,
                message: 'Job calendar event created successfully'
            });
        } else if (type === 'site-visit') {
            // Create site visit events based on client tier
            const { jobNo, client, projectDate, tier, engineerEmail, engineerName, location } = eventData;
            const eventIds = await createSiteVisitEvents(
                jobNo,
                client,
                new Date(projectDate),
                tier,
                engineerEmail,
                engineerName,
                location
            );
            return res.status(200).json({
                success: true,
                eventIds,
                message: `${eventIds.length} site visit events created successfully`
            });
        } else {
            return res.status(400).json({ message: 'Invalid event type' });
        }
    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Calendar Event Creation Failed',
            context: { userId: req.user.id, body: req.body }
        });
    }
}

const authorizedRoles: Role[] = [
    'asphalt_engineer',
    'profiling_engineer',
    'spray_admin',
    'scheduler_admin',
    'management_admin'
];

export default withAuth(handler, authorizedRoles);
