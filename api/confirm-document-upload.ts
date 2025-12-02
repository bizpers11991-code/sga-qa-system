import { DocumentsData } from './_lib/sharepointData.js';
import { uploadFile } from './_lib/sharepointFiles.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { SpecificationDocument } from '../src/types.js';
import type { VercelResponse } from '@vercel/node';
import { handleApiError } from './_lib/errors.js';

/**
 * Confirm Document Upload
 *
 * This endpoint now handles the actual file upload to SharePoint.
 * It accepts the file data (base64) along with metadata and stores both.
 */
async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { title, category, fileKey, fileType, uploadedBy, fileData } = req.body;
        if (!title || !category || !fileKey || !fileType || !uploadedBy) {
            return res.status(400).json({ message: 'Missing required document metadata.' });
        }

        let fileUrl: string;

        // If file data is provided, upload to SharePoint
        if (fileData) {
            const base64Match = fileData.match(/^data:(.+);base64,(.+)$/);
            const buffer = base64Match
                ? Buffer.from(base64Match[2], 'base64')
                : Buffer.from(fileData, 'base64');

            fileUrl = await uploadFile(fileKey, buffer, fileType);
        } else {
            // For backwards compatibility, construct URL from key
            fileUrl = `${process.env.SHAREPOINT_SITE_URL}/SGAQAFiles/${fileKey}`;
        }

        const newDocument = {
            title,
            category,
            fileKey,
            fileUrl,
            fileType,
            uploadedBy,
            uploadedAt: new Date().toISOString(),
        };

        // Save document metadata to SharePoint list
        const savedDocument = await DocumentsData.create(newDocument);

        res.status(200).json({ message: 'Document confirmed and saved.', document: savedDocument });

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Confirm Document Upload Failure',
            context: { fileKey: req.body.fileKey, authenticatedUserId: req.user.id },
        });
    }
}

export default withAuth(handler, ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'management_admin', 'scheduler_admin', 'hseq_manager']);