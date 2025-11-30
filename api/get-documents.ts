import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DocumentsData } from './_lib/sharepointData.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { SpecificationDocument } from '../src/types.js';
import { handleApiError } from './_lib/errors.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    try {
        // Get all documents from SharePoint
        const documents = await DocumentsData.getAll();

        // Sort by uploadedAt descending (most recent first)
        const sortedDocuments = documents.sort((a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );

        res.status(200).json(sortedDocuments);

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Fetch Documents Failure',
            context: { authenticatedUserId: req.user.id },
        });
    }
}

export default withAuth(handler, [
    'asphalt_foreman', 'profiling_foreman', 'spray_foreman',
    'asphalt_engineer', 'profiling_engineer', 'spray_admin', 
    'management_admin', 'scheduler_admin', 'hseq_manager'
]);