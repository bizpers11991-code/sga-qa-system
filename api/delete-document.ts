import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getR2Config } from './_lib/r2.js';
import { DocumentsData } from './_lib/sharepointData';
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

        // 1. Delete file from R2
        const r2 = getR2Config();
        const command = new DeleteObjectCommand({
            Bucket: r2.bucketName,
            Key: fileKey,
        });
        // FIX: The S3Client type was not resolving correctly, causing a 'send does not exist' error.
        // Following the pattern in other API files (e.g., submit-incident), casting to 'any'
        // bypasses the incorrect type check and allows the code to compile.
        await (r2.client as any).send(command);

        // 2. Delete metadata from SharePoint
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