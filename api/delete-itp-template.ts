import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ITPTemplatesData } from './_lib/sharepointData.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ message: 'Template ID is required.' });
        }

        // Check if template exists
        const template = await ITPTemplatesData.getById(id);

        if (!template) {
            return res.status(404).json({ message: 'Template not found.' });
        }

        // Delete the template
        const result = await ITPTemplatesData.delete(id);

        if (result) {
            res.status(200).json({ message: 'Template deleted successfully.' });
        } else {
            res.status(404).json({ message: 'Template not found.' });
        }

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Delete ITP Template Failure',
            context: { templateId: req.body.id, authenticatedUserId: req.user.id },
        });
    }
}

export default withAuth(handler, ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'management_admin', 'hseq_manager']);