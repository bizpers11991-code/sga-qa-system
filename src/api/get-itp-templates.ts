import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { ItpChecklistData, Role } from '../types';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    try {
        const redis = getRedisInstance();
        const { id } = req.query;

        // If a specific ID is requested, fetch only that one
        if (id && typeof id === 'string') {
            const templateJson = await redis.hget('itp_templates', id);
            if (!templateJson) {
                return res.status(404).json({ message: 'Template not found.' });
            }
            return res.status(200).json(JSON.parse(templateJson as string));
        }

        // Otherwise, fetch all templates
        const allTemplates = await redis.hgetall('itp_templates');

        if (!allTemplates) {
            return res.status(200).json([]);
        }

        const templatesData: ItpChecklistData[] = Object.values(allTemplates)
            .map(item => JSON.parse(item as string))
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        res.status(200).json(templatesData);

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Fetch ITP Templates Failure',
            context: { templateId: req.query.id, authenticatedUserId: req.user.id },
        });
    }
}

const authorizedRoles: Role[] = [
    'asphalt_engineer', 'profiling_engineer', 'spray_admin',
    'management_admin', 'scheduler_admin', 'hseq_manager'
];

export default withAuth(handler, authorizedRoles);