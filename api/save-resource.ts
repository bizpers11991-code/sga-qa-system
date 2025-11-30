// api/save-resource.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ResourcesData } from './_lib/sharepointData';
import { CrewResource, EquipmentResource, ResourceType } from '../src/types';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    try {
        const { type, resource } = req.body as { type: ResourceType; resource: CrewResource | EquipmentResource };

        if (!type || !resource || !resource.id) {
            return res.status(400).json({ message: 'Type and resource data with an ID are required.' });
        }

        // Add resourceType to the resource data for SharePoint filtering
        const resourceWithType = { ...resource, resourceType: type };

        // Check if resource exists by getting all and finding by custom id
        const allResources = await ResourcesData.getAll();
        const existingResource = allResources.find((r: any) => r.id === resource.id && r.resourceType === type);

        if (existingResource) {
            // Update existing resource (using SharePoint's internal Id)
            await ResourcesData.update(existingResource.id, resourceWithType);
        } else {
            // Create new resource
            await ResourcesData.create(resourceWithType);
        }

        res.status(200).json({ message: `${type} resource saved successfully.` });

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Save Resource Failure',
            context: { resourceId: req.body.resource?.id, authenticatedUserId: req.user.id },
        });
    }
}

export default withAuth(handler, ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'management_admin', 'hseq_manager']);