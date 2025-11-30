import type { VercelResponse } from '@vercel/node';
import { ProjectsData, TendersData } from './_lib/sharepointData';
import { Project, TenderHandover } from '../src/types';
import { withAuth, AuthenticatedRequest } from './_lib/auth';
import { handleApiError } from './_lib/errors';
import {
  generateProjectNumber,
  validateProject,
  initializeDivisions,
} from './_lib/projectHandler';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  const projectData: Partial<Project> & {
    handoverId?: string;
    divisionsRequired?: { asphalt: boolean; profiling: boolean; spray: boolean };
  } = request.body;

  try {
    // If handoverId is provided, fetch handover data
    let handover: TenderHandover | null = null;
    if (projectData.handoverId) {
      handover = await TendersData.getById(projectData.handoverId);
    }

    // Get all existing projects to generate next number
    const existingProjects = await ProjectsData.getAll();

    // Determine project owner division
    let projectOwnerDivision: 'Asphalt' | 'Profiling' | 'Spray' = 'Asphalt';
    if (handover) {
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

    // Generate project number
    const projectNumber = generateProjectNumber(existingProjects);

    const completeProject: Omit<Project, 'id'> = {
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
    validateProject(completeProject as Project);

    // Create project in SharePoint
    const createdProject = await ProjectsData.create(completeProject);

    // If created from handover, update handover status
    if (handover) {
      await TendersData.update(handover.id, { status: 'Active' });
    }

    return response.status(201).json({
      success: true,
      message: `Project ${projectNumber} created successfully`,
      project: createdProject,
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
