import { DocumentsData } from './_lib/sharepointData';
import { getR2Config } from './_lib/r2.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { SpecificationDocument } from '../src/types';
import type { VercelResponse } from '@vercel/node';
import { handleApiError } from './_lib/errors.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { title, category, fileKey, fileType, uploadedBy } = req.body;
        if (!title || !category || !fileKey || !fileType || !uploadedBy) {
            return res.status(400).json({ message: 'Missing required document metadata.' });
        }

        const r2 = getR2Config();

        const newDocument = {
            title,
            category,
            fileKey,
            fileUrl: `${r2.publicUrl}/${fileKey}`,
            fileType,
            uploadedBy,
            uploadedAt: new Date().toISOString(),
        };

        // Save document to SharePoint
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