import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getR2Config } from './_lib/r2.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import type { VercelResponse } from '@vercel/node';
import { handleApiError } from './_lib/errors.js';

const UPLOAD_EXPIRATION_SECONDS = 60; // 1 minute

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { fileName, fileType } = req.body;
        if (!fileName || !fileType) {
            return res.status(400).json({ message: 'fileName and fileType are required.' });
        }

        const r2 = getR2Config();
        
        // Sanitize file name and create a unique key
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const key = `documents/${Date.now()}_${sanitizedFileName}`;

        const command = new PutObjectCommand({
            Bucket: r2.bucketName,
            Key: key,
            ContentType: fileType,
        });
        
        const url = await getSignedUrl(r2.client, command, { expiresIn: UPLOAD_EXPIRATION_SECONDS });

        res.status(200).json({ url, key });

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Generate Presigned URL Failure',
            context: { fileName: req.body.fileName, authenticatedUserId: req.user.id },
        });
    }
}

export default withAuth(handler, ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'management_admin', 'scheduler_admin', 'hseq_manager']);