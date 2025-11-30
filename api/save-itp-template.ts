import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ITPTemplatesData } from './_lib/sharepointData';
import { ItpChecklistData } from '../src/types';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    try {
        const templateData: ItpChecklistData = req.body;

        if (!templateData.id || !templateData.name) {
            return res.status(400).json({ message: 'Template ID and name are required.' });
        }

        // Check if template exists
        const existingTemplate = await ITPTemplatesData.getById(templateData.id);

        if (existingTemplate) {
            // Update existing template
            await ITPTemplatesData.update(templateData.id, templateData);
        } else {
            // Create new template
            await ITPTemplatesData.create(templateData);
        }

        res.status(200).json({ message: 'Template saved successfully.', template: templateData });

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Save ITP Template Failure',
            context: { templateId: req.body.id, authenticatedUserId: req.user.id },
        });
    }
}

export default withAuth(handler, ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'management_admin', 'hseq_manager']);