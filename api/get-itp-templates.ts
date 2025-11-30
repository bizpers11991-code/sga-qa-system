import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ITPTemplatesData } from './_lib/sharepointData';
import { ItpChecklistData, Role } from '../src/types';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    try {
        const { id } = req.query;

        // If a specific ID is requested, fetch only that one
        if (id && typeof id === 'string') {
            const template = await ITPTemplatesData.getById(id);
            if (!template) {
                return res.status(404).json({ message: 'Template not found.' });
            }
            return res.status(200).json(template);
        }

        // Otherwise, fetch all templates
        const allTemplates = await ITPTemplatesData.getAll();

        if (!allTemplates || allTemplates.length === 0) {
            return res.status(200).json([]);
        }

        const templatesData = allTemplates.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));

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