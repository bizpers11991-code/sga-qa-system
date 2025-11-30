import type { VercelResponse } from '@vercel/node';
import { TendersData } from './_lib/sharepointData';
import { TenderHandover } from '../src/types';
import { withAuth, AuthenticatedRequest } from './_lib/auth';
import { handleApiError, NotFoundError, AuthorizationError } from './_lib/errors';
import { validateHandover } from './_lib/handoverHandler';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  try {
    const { id } = request.query;
    const updates: Partial<TenderHandover> = request.body;

    if (!id || typeof id !== 'string') {
      throw new NotFoundError('Handover', { providedId: id });
    }

    // Fetch existing handover from SharePoint
    const existingHandover = await TendersData.getById(id);

    if (!existingHandover) {
      throw new NotFoundError('Handover', { handoverId: id });
    }

    // Authorization check
    const isAuthorized =
      request.user.role === 'tender_admin' ||
      request.user.role === 'scheduler_admin' ||
      request.user.role === 'management_admin' ||
      request.user.id === existingHandover.projectOwnerId;

    if (!isAuthorized) {
      throw new AuthorizationError('You do not have permission to update this handover', {
        userId: request.user.id,
        handoverId: id,
        projectOwnerId: existingHandover.projectOwnerId,
      });
    }

    // Prevent updating protected fields
    delete updates.id;
    delete updates.handoverNumber;
    delete updates.dateCreated;
    delete updates.createdBy;

    // Merge and validate
    const updatedHandover: TenderHandover = {
      ...existingHandover,
      ...updates,
    } as TenderHandover;

    validateHandover(updatedHandover);

    // Update in SharePoint
    const result = await TendersData.update(id, updates);

    return response.status(200).json({
      success: true,
      message: `Handover ${existingHandover.handoverNumber} updated successfully`,
      handover: result,
    });

  } catch (error: any) {
    await handleApiError({
      res: response,
      error,
      title: 'Update Handover Failure',
      context: {
        handoverId: request.query.id,
        authenticatedUserId: request.user.id,
      },
    });
  }
}

export default withAuth(handler, [
  'tender_admin',
  'scheduler_admin',
  'management_admin',
  'asphalt_engineer',
  'profiling_engineer',
  'spray_admin',
]);
