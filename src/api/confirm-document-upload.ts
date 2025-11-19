import { getRedisInstance } from './_lib/redis.js';
import { getR2Config } from './_lib/r2.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { SpecificationDocument } from '../types';
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

        const redis = getRedisInstance();
        const r2 = getR2Config();

        const newDocument: SpecificationDocument = {
            id: `doc-${Date.now()}`,
            title,
            category,
            fileKey,
            fileUrl: `${r2.publicUrl}/${fileKey}`,
            fileType,
            uploadedBy,
            uploadedAt: new Date().toISOString(),
        };

        const pipeline = redis.pipeline();
        pipeline.set(`document:${newDocument.id}`, JSON.stringify(newDocument));
        pipeline.sadd('documents:index', newDocument.id);
        await pipeline.exec();

        res.status(200).json({ message: 'Document confirmed and saved.', document: newDocument });

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