import type { VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { Project, TenderHandover } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';
import {
  generateProjectNumber,
  validateProject,
  initializeDivisions,
} from './_lib/projectHandler.js';

const prepareObjectForRedis = (obj: Record<string, any>): Record<string, string> => {
  const prepared: Record<string, string> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] != null) {
      const value = obj[key];
      if (typeof value === 'object') {
        prepared[key] = JSON.stringify(value);
      } else {
        prepared[key] = String(value);
      }
    }
  }
  return prepared;
};

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  const projectData: Partial<Project> & {
    handoverId?: string;
    divisionsRequired?: { asphalt: boolean; profiling: boolean; spray: boolean };
  } = request.body;

  try {
    const redis = getRedisInstance();

    // If handoverId is provided, fetch handover data
    let handover: TenderHandover | null = null;
    if (projectData.handoverId) {
      const handoverKey = `handover:${projectData.handoverId}`;
      const handoverHash = await redis.hgetall(handoverKey);

      if (handoverHash && Object.keys(handoverHash).length > 0) {
        const handoverObj: Partial<TenderHandover> = {};
        for (const [key, value] of Object.entries(handoverHash)) {
          try {
            handoverObj[key as keyof TenderHandover] = JSON.parse(value as string);
          } catch {
            (handoverObj as any)[key] = value;
          }
        }
        handover = handoverObj as TenderHandover;
      }
    }

    // Get all existing projects to generate next number
    const projectKeys = await redis.smembers('projects:index');
    const existingProjects: Project[] = [];

    for (const projectId of projectKeys) {
      const projectKey = `project:${projectId}`;
      const projectHash = await redis.hgetall(projectKey);

      if (projectHash && Object.keys(projectHash).length > 0) {
        const proj: Partial<Project> = {};
        for (const [key, value] of Object.entries(projectHash)) {
          try {
            proj[key as keyof Project] = JSON.parse(value as string);
          } catch {
            (proj as any)[key] = value;
          }
        }
        existingProjects.push(proj as Project);
      }
    }

    // Determine project owner division
    let projectOwnerDivision: 'Asphalt' | 'Profiling' | 'Spray' = 'Asphalt';
    if (handover) {
      // Determine based on divisions required (default to Asphalt if multiple)
      if (handover.divisionsRequired.asphalt) {
        projectOwnerDivision = 'Asphalt';
      } else if (handover.divisionsRequired.profiling) {
        projectOwnerDivision = 'Profiling';
      } else if (handover.divisionsRequired.spray) {
        projectOwnerDivision = 'Spray';
      }
    } else if (projectData.projectOwnerDivision) {
      projectOwnerDivision = projectData.projectOwnerDivision;
    }

    // Initialize divisions
    const divisionsRequired = handover?.divisionsRequired || projectData.divisionsRequired || {
      asphalt: true,
      profiling: false,
      spray: false,
    };
    const divisions = initializeDivisions(divisionsRequired);

    // Generate project number and create full project object
    const projectNumber = generateProjectNumber(existingProjects);
    const projectId = `project-${Date.now()}`;

    const completeProject: Project = {
      id: projectId,
      projectNumber,
      handoverId: projectData.handoverId || handover?.id || '',
      projectName: projectData.projectName || handover?.projectName || '',
      client: projectData.client || handover?.clientName || '',
      clientTier: projectData.clientTier || handover?.clientTier || 'Tier 3',
      location: projectData.location || handover?.location || '',
      projectOwnerId: projectData.projectOwnerId || handover?.projectOwnerId || '',
      projectOwnerDivision,
      scopingPersonId: projectData.scopingPersonId || handover?.scopingPersonId || '',
      estimatedStartDate: projectData.estimatedStartDate || handover?.estimatedStartDate || '',
      estimatedEndDate: projectData.estimatedEndDate || handover?.estimatedEndDate || '',
      divisions,
      status: 'Scoping',
      jobIds: [],
      scopeReportIds: [],
    };

    // Validate project
    validateProject(completeProject);

    // Store project in Redis
    const projectKey = `project:${projectId}`;
    const preparedProject = prepareObjectForRedis(completeProject);

    const pipeline = redis.pipeline();
    pipeline.hset(projectKey, preparedProject);
    pipeline.sadd('projects:index', projectId);

    await pipeline.exec();

    // If created from handover, update handover status
    if (handover) {
      const handoverKey = `handover:${handover.id}`;
      await redis.hset(handoverKey, 'status', 'Active');
    }

    return response.status(201).json({
      success: true,
      message: `Project ${projectNumber} created successfully`,
      project: completeProject,
    });

  } catch (error: any) {
    await handleApiError({
      res: response,
      error,
      title: 'Create Project Failure',
      context: {
        projectName: projectData.projectName,
        authenticatedUserId: request.user.id,
      },
    });
  }
}

// Multiple roles can create projects
export default withAuth(handler, [
  'tender_admin',
  'scheduler_admin',
  'asphalt_engineer',
  'profiling_engineer',
  'spray_admin',
  'management_admin',
]);
