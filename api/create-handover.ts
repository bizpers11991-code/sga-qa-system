import type { VercelResponse } from '@vercel/node';
import { getTenders, createRecord, Tables } from './_lib/dataverse.js';
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
    const existingHandovers = await getTenders();

    // Generate handover number
    const handoverNumber = generateHandoverNumber(existingHandovers as TenderHandover[]);

    // Prepare Dataverse record
    const dataverseRecord = {
      cr3cd_handovernumber: handoverNumber,
      cr3cd_datecreated: new Date().toISOString(),
      cr3cd_createdby: request.user.id,
      cr3cd_clientid: handoverData.clientId!,
      cr3cd_clientname: handoverData.clientName!,
      cr3cd_clienttier: handoverData.clientTier!,
      cr3cd_projectname: handoverData.projectName!,
      cr3cd_projectdescription: handoverData.projectDescription!,
      cr3cd_location: handoverData.location!,
      cr3cd_estimatedstartdate: handoverData.estimatedStartDate!,
      cr3cd_estimatedenddate: handoverData.estimatedEndDate!,
      cr3cd_divisionsrequired: JSON.stringify(handoverData.divisionsRequired!),
      cr3cd_projectownerid: handoverData.projectOwnerId!,
      cr3cd_scopingpersonid: handoverData.scopingPersonId!,
      cr3cd_estimatedarea: handoverData.estimatedArea || null,
      cr3cd_estimatedthickness: handoverData.estimatedThickness || null,
      cr3cd_asphaltplant: handoverData.asphaltPlant || null,
      cr3cd_specialrequirements: handoverData.specialRequirements || null,
      cr3cd_contractvalue: handoverData.contractValue || null,
      cr3cd_contractnumber: handoverData.contractNumber || null,
      cr3cd_purchaseordernumber: handoverData.purchaseOrderNumber || null,
      cr3cd_attachments: JSON.stringify(handoverData.attachments || []),
      cr3cd_status: handoverData.status || 'Draft',
    };

    // Create tender in Dataverse
    const createdRecord = await createRecord(Tables.Tender, dataverseRecord);

    // Build response object
    const completeHandover: TenderHandover = {
      id: createdRecord.cr3cd_tenderid,
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

    // Respond to user immediately
    response.status(201).json({
      success: true,
      message: `Handover ${handoverNumber} created successfully`,
      handover: completeHandover,
    });

    // --- Asynchronous Post-Creation Tasks ---
    // These run after the response has been sent

    // 1. Create SharePoint folder structure
    // Generate project number (will be used when project is actually created)
    const projectNumber = `PRJ-${new Date().getFullYear()}-${handoverNumber.split('-')[2]}`;
    createProjectFolderStructure(projectNumber).catch(err => {
      console.error(`[Non-blocking] Failed to create SharePoint folders for ${projectNumber}:`, err);
    });

    // 2. Create site visit calendar events
    const siteVisits = calculateSiteVisitDates(
      completeHandover.clientTier,
      completeHandover.estimatedStartDate
    );

    createSiteVisitEvents(completeHandover, siteVisits).catch(err => {
      console.error(`[Non-blocking] Failed to create site visit events for ${handoverNumber}:`, err);
    });

    // 3. Send notifications
    sendHandoverNotifications(completeHandover).catch(err => {
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

// Only tender_admin, scheduler_admin, and management_admin can create handovers
export default withAuth(handler, ['tender_admin', 'scheduler_admin', 'management_admin']);
