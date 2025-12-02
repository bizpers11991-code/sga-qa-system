import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import type { VercelResponse } from '@vercel/node';
import { handleApiError } from './_lib/errors.js';

/**
 * Generate Upload URL
 *
 * Since we're now using SharePoint for file storage, this endpoint returns
 * a direct upload endpoint that the client should use with the confirm-document-upload
 * endpoint to upload files via the server (which handles SharePoint auth).
 *
 * Flow:
 * 1. Client calls this endpoint to get an upload key
 * 2. Client sends file + key to confirm-document-upload endpoint
 * 3. Server uploads to SharePoint and stores metadata
 */
async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { fileName, fileType } = req.body;
        if (!fileName || !fileType) {
            return res.status(400).json({ message: 'fileName and fileType are required.' });
        }

        // Sanitize file name and create a unique key
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const datePath = new Date().toISOString().split('T')[0];
        const key = `documents/${datePath}/${Date.now()}_${sanitizedFileName}`;

        // Return the key for use with the upload endpoint
        // The actual upload happens server-side via confirm-document-upload
        res.status(200).json({
            key,
            uploadEndpoint: '/api/upload-document',
            message: 'Use the uploadEndpoint to upload your file with this key'
        });

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Generate Upload Key Failure',
            context: { fileName: req.body.fileName, authenticatedUserId: req.user.id },
        });
    }
}

export default withAuth(handler, ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'management_admin', 'scheduler_admin', 'hseq_manager']);