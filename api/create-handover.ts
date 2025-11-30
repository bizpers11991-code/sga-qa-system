import type { VercelResponse } from '@vercel/node';
import { TendersData } from './_lib/sharepointData.js';
import { TenderHandover } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';
import {
  generateHandoverNumber,
  validateHandover,
  createProjectFolderStructure,
  calculateSiteVisitDates,
  createSiteVisitEvents,
  sendHandoverNotifications,
} from './_lib/handoverHandler.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  const handoverData: Partial<TenderHandover> = request.body;

  try {
    // Validate handover data
    validateHandover(handoverData);

    // Get all existing handovers to generate next number
    const existingHandovers = await TendersData.getAll();

    // Generate handover number
    const handoverNumber = generateHandoverNumber(existingHandovers);

    // Create complete handover object
    const completeHandover: Omit<TenderHandover, 'id'> = {
      handoverNumber,
      dateCreated: new Date().toISOString(),
      createdBy: request.user.id,
      clientId: handoverData.clientId!,
      clientName: handoverData.clientName!,
      clientTier: handoverData.clientTier!,
      projectName: handoverData.projectName!,
      projectDescription: handoverData.projectDescription!,
      location: handoverData.location!,
      estimatedStartDate: handoverData.estimatedStartDate!,
      estimatedEndDate: handoverData.estimatedEndDate!,
      divisionsRequired: handoverData.divisionsRequired!,
      projectOwnerId: handoverData.projectOwnerId!,
      scopingPersonId: handoverData.scopingPersonId!,
      estimatedArea: handoverData.estimatedArea,
      estimatedThickness: handoverData.estimatedThickness,
      asphaltPlant: handoverData.asphaltPlant,
      specialRequirements: handoverData.specialRequirements,
      contractValue: handoverData.contractValue,
      contractNumber: handoverData.contractNumber,
      purchaseOrderNumber: handoverData.purchaseOrderNumber,
      attachments: handoverData.attachments || [],
      status: handoverData.status || 'Draft',
    };

    // Create in SharePoint
    const createdHandover = await TendersData.create(completeHandover);

    // Respond to user immediately
    response.status(201).json({
      success: true,
      message: `Handover ${handoverNumber} created successfully`,
      handover: createdHandover,
    });

    // --- Asynchronous Post-Creation Tasks ---
    const projectNumber = `PRJ-${new Date().getFullYear()}-${handoverNumber.split('-')[2]}`;

    createProjectFolderStructure(projectNumber).catch(err => {
      console.error(`[Non-blocking] Failed to create SharePoint folders for ${projectNumber}:`, err);
    });

    const siteVisits = calculateSiteVisitDates(
      createdHandover.clientTier,
      createdHandover.estimatedStartDate
    );

    createSiteVisitEvents(createdHandover, siteVisits).catch(err => {
      console.error(`[Non-blocking] Failed to create site visit events for ${handoverNumber}:`, err);
    });

    sendHandoverNotifications(createdHandover).catch(err => {
      console.error(`[Non-blocking] Failed to send notifications for ${handoverNumber}:`, err);
    });

  } catch (error: any) {
    await handleApiError({
      res: response,
      error,
      title: 'Create Handover Failure',
      context: {
        projectName: handoverData.projectName,
        authenticatedUserId: request.user.id,
      },
    });
  }
}

export default withAuth(handler, ['tender_admin', 'scheduler_admin', 'management_admin']);
