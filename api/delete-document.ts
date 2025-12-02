import { deleteFile } from './_lib/sharepointFiles.js';
import { DocumentsData } from './_lib/sharepointData.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import type { VercelResponse } from '@vercel/node';
import { handleApiError } from './_lib/errors.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { id, fileKey } = req.body;
        if (!id || !fileKey) {
            return res.status(400).json({ message: 'Document ID and File Key are required for deletion.' });
        }

        // 1. Delete file from SharePoint document library
        try {
            await deleteFile(fileKey);
        } catch (fileError: any) {
            // Log but don't fail if file doesn't exist
            console.warn(`[Delete Document] File deletion warning for ${fileKey}:`, fileError.message);
        }

        // 2. Delete metadata from SharePoint list
        await DocumentsData.delete(id);

        res.status(200).json({ message: 'Document deleted successfully.' });

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Delete Document Failure',
            context: { documentId: req.body.id, fileKey: req.body.fileKey, authenticatedUserId: req.user.id },
        });
    }
}

export default withAuth(handler, ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'management_admin', 'scheduler_admin', 'hseq_manager']);