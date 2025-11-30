import type { VercelResponse } from '@vercel/node';
import { DivisionRequestsData, ProjectsData } from './_lib/sharepointData';
import { DivisionRequest } from '../src/types';
import { withAuth, AuthenticatedRequest } from './_lib/auth';
import { handleApiError, NotFoundError } from './_lib/errors';
import {
  generateRequestNumber,
  validateDivisionRequest,
  getDefaultEngineerForDivision,
  notifyDivisionEngineer,
} from './_lib/divisionRequestHandler';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  const requestData: Partial<DivisionRequest> = request.body;

  try {
    // Validate division request data
    validateDivisionRequest(requestData);

    // Fetch project to verify it exists
    const project = await ProjectsData.getById(requestData.projectId!);

    if (!project) {
      throw new NotFoundError('Project', { projectId: requestData.projectId });
    }

    // Get all existing division requests to generate next number
    const existingRequests = await DivisionRequestsData.getAll();

    // Auto-assign engineer if not provided
    let requestedTo = requestData.requestedTo;
    if (!requestedTo) {
      requestedTo = getDefaultEngineerForDivision(requestData.requestedDivision!);
    }

    // Generate request number
    const requestNumber = generateRequestNumber(existingRequests);

    const completeRequest: Omit<DivisionRequest, 'id'> = {
      requestNumber,
      projectId: requestData.projectId!,
      requestedBy: request.user.id,
      requestedDivision: requestData.requestedDivision!,
      requestedTo,
      workDescription: requestData.workDescription!,
      location: requestData.location!,
      requestedDates: requestData.requestedDates!,
      status: 'Pending',
    };

    // Create in SharePoint
    const createdRequest = await DivisionRequestsData.create(completeRequest);

    // Respond immediately
    response.status(201).json({
      success: true,
      message: `Division request ${requestNumber} created successfully`,
      request: createdRequest,
    });

    // Async: Send notification to division engineer
    notifyDivisionEngineer(createdRequest, project).catch(err => {
      console.error(`[Non-blocking] Failed to notify division engineer:`, err);
    });

  } catch (error: any) {
    await handleApiError({
      res: response,
      error,
      title: 'Create Division Request Failure',
      context: {
        projectId: requestData.projectId,
        requestedDivision: requestData.requestedDivision,
        authenticatedUserId: request.user.id,
      },
    });
  }
}

export default withAuth(handler, [
  'asphalt_engineer',
  'profiling_engineer',
  'spray_admin',
  'scheduler_admin',
  'management_admin',
]);
