/**
 * Upload Document to SharePoint
 *
 * Handles file uploads to SharePoint document library.
 * Accepts multipart form data with the file and metadata.
 */
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import type { VercelResponse } from '@vercel/node';
import { handleApiError } from './_lib/errors.js';
import { uploadFile } from './_lib/sharepointFiles.js';
import { DocumentsData } from './_lib/sharepointData.js';

// Vercel serverless functions have a 4.5MB body limit
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { title, category, fileKey, fileType, uploadedBy, fileData } = req.body;

        if (!title || !category || !fileKey || !fileType || !uploadedBy || !fileData) {
            return res.status(400).json({
                message: 'Missing required fields: title, category, fileKey, fileType, uploadedBy, fileData'
            });
        }

        // Decode base64 file data
        const base64Match = fileData.match(/^data:(.+);base64,(.+)$/);
        const buffer = base64Match
            ? Buffer.from(base64Match[2], 'base64')
            : Buffer.from(fileData, 'base64');

        if (buffer.length > MAX_FILE_SIZE) {
            return res.status(413).json({
                message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
            });
        }

        // Upload file to SharePoint
        const fileUrl = await uploadFile(fileKey, buffer, fileType);

        // Create document metadata record
        const newDocument = {
            title,
            category,
            fileKey,
            fileUrl,
            fileType,
            uploadedBy,
            uploadedAt: new Date().toISOString(),
        };

        const savedDocument = await DocumentsData.create(newDocument);

        res.status(200).json({
            message: 'Document uploaded successfully.',
            document: savedDocument
        });

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Upload Document Failure',
            context: { fileKey: req.body?.fileKey, authenticatedUserId: req.user.id },
        });
    }
}

export default withAuth(handler, ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'management_admin', 'scheduler_admin', 'hseq_manager']);
