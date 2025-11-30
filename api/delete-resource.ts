// api/delete-resource.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ResourcesData } from './_lib/sharepointData.js';
import { ResourceType } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    try {
        const { type, id } = req.body as { type: ResourceType; id: string };

        if (!type || !id) {
            return res.status(400).json({ message: 'Type and ID are required.' });
        }

        // Find the resource by custom id and type
        const allResources = await ResourcesData.getAll();
        const resource = allResources.find((r: any) => r.id === id && r.resourceType === type);

        if (!resource) {
            return res.status(404).json({ message: 'Resource not found.' });
        }

        // Delete using SharePoint's internal Id
        const result = await ResourcesData.delete(resource.id);

        if (result) {
            res.status(200).json({ message: `${type} resource deleted successfully.` });
        } else {
            res.status(404).json({ message: 'Resource not found.' });
        }

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Delete Resource Failure',
            context: { resourceId: req.body.id, authenticatedUserId: req.user.id },
        });
    }
}

export default withAuth(handler, ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'management_admin', 'hseq_manager']);