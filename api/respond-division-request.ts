import type { VercelResponse } from '@vercel/node';
import { DivisionRequestsData, ProjectsData } from './_lib/sharepointData';
import { DivisionRequest } from '../src/types';
import { withAuth, AuthenticatedRequest } from './_lib/auth';
import { handleApiError, NotFoundError, AuthorizationError, ValidationError } from './_lib/errors';
import {
  notifyProjectOwner,
  createDivisionCalendarEvents,
  createJobsForRequest,
} from './_lib/divisionRequestHandler';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  try {
    const { id } = request.query;
    const {
      response: requestResponse,
      responseNotes,
      assignedCrewId,
      assignedForemanId,
      confirmedDates,
    } = request.body as {
      response: 'accept' | 'reject';
      responseNotes?: string;
      assignedCrewId?: string;
      assignedForemanId?: string;
      confirmedDates?: string[];
    };

    if (!id || typeof id !== 'string') {
      throw new NotFoundError('Division Request', { providedId: id });
    }

    if (!requestResponse || !['accept', 'reject'].includes(requestResponse)) {
      throw new ValidationError('Response must be either "accept" or "reject"', {
        providedResponse: requestResponse,
      });
    }

    // Fetch existing division request from SharePoint
    const existingRequest = await DivisionRequestsData.getById(id);

    if (!existingRequest) {
      throw new NotFoundError('Division Request', { requestId: id });
    }

    // Authorization check
    if (request.user.id !== existingRequest.requestedTo) {
      throw new AuthorizationError('You are not authorized to respond to this request', {
        userId: request.user.id,
        requestedTo: existingRequest.requestedTo,
      });
    }

    // Validate accept requirements
    if (requestResponse === 'accept') {
      if (!assignedCrewId || !assignedForemanId || !confirmedDates || confirmedDates.length === 0) {
        throw new ValidationError(
          'Accepting a request requires assignedCrewId, assignedForemanId, and confirmedDates',
          { assignedCrewId, assignedForemanId, confirmedDates }
        );
      }
    }

    // Prepare updates
    const updates: Partial<DivisionRequest> = {
      status: requestResponse === 'accept' ? 'Accepted' : 'Rejected',
      responseNotes: responseNotes || '',
    };

    if (requestResponse === 'accept') {
      updates.assignedCrewId = assignedCrewId;
      updates.assignedForemanId = assignedForemanId;
      updates.confirmedDates = confirmedDates;
    }

    // Update in SharePoint
    const updatedRequest = await DivisionRequestsData.update(id, updates);

    // Fetch project
    const project = await ProjectsData.getById(existingRequest.projectId);

    // Respond immediately
    response.status(200).json({
      success: true,
      message: `Division request ${existingRequest.requestNumber} ${requestResponse}ed successfully`,
      request: updatedRequest,
    });

    // Async tasks
    if (project) {
      notifyProjectOwner(updatedRequest as DivisionRequest, project, requestResponse).catch(err => {
        console.error(`[Non-blocking] Failed to notify project owner:`, err);
      });

      if (requestResponse === 'accept') {
        createDivisionCalendarEvents(updatedRequest as DivisionRequest, project).catch(err => {
          console.error(`[Non-blocking] Failed to create calendar events:`, err);
        });

        createJobsForRequest(updatedRequest as DivisionRequest, project).catch(err => {
          console.error(`[Non-blocking] Failed to create jobs:`, err);
        });
      }
    }

  } catch (error: any) {
    await handleApiError({
      res: response,
      error,
      title: 'Respond Division Request Failure',
      context: {
        requestId: request.query.id,
        response: request.body?.response,
        authenticatedUserId: request.user.id,
      },
    });
  }
}

export default withAuth(handler, [
  'asphalt_engineer',
  'profiling_engineer',
  'spray_admin',
  'management_admin',
]);
