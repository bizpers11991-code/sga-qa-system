import type { VercelResponse } from '@vercel/node';
import { getTenders } from './_lib/dataverse.js';
import { TenderHandover } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

/**
 * Map Dataverse record to TenderHandover type
 */
const mapToTenderHandover = (record: any): TenderHandover => {
  return {
    id: record.cr3cd_tenderid,
    handoverNumber: record.cr3cd_handovernumber,
    dateCreated: record.cr3cd_datecreated,
    createdBy: record.cr3cd_createdby,
    clientId: record.cr3cd_clientid,
    clientName: record.cr3cd_clientname,
    clientTier: record.cr3cd_clienttier,
    projectName: record.cr3cd_projectname,
    projectDescription: record.cr3cd_projectdescription,
    location: record.cr3cd_location,
    estimatedStartDate: record.cr3cd_estimatedstartdate,
    estimatedEndDate: record.cr3cd_estimatedenddate,
    divisionsRequired: JSON.parse(record.cr3cd_divisionsrequired || '{}'),
    projectOwnerId: record.cr3cd_projectownerid,
    scopingPersonId: record.cr3cd_scopingpersonid,
    estimatedArea: record.cr3cd_estimatedarea,
    estimatedThickness: record.cr3cd_estimatedthickness,
    asphaltPlant: record.cr3cd_asphaltplant,
    specialRequirements: record.cr3cd_specialrequirements,
    contractValue: record.cr3cd_contractvalue,
    contractNumber: record.cr3cd_contractnumber,
    purchaseOrderNumber: record.cr3cd_purchaseordernumber,
    attachments: JSON.parse(record.cr3cd_attachments || '[]'),
    status: record.cr3cd_status,
  };
};

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  try {
    // Get query parameters for filtering
    const {
      status,
      clientTier,
      projectOwnerId,
      dateFrom,
      dateTo,
    } = request.query;

    // Get all handovers from Dataverse
    const dataverseRecords = await getTenders(status as string | undefined);

    if (!dataverseRecords || dataverseRecords.length === 0) {
      return response.status(200).json([]);
    }

    // Map to TenderHandover type
    let handovers = dataverseRecords.map(mapToTenderHandover);

    // Apply additional client-side filters (Dataverse doesn't support complex queries easily)
    if (clientTier && typeof clientTier === 'string') {
      handovers = handovers.filter(h => h.clientTier === clientTier);
    }

    if (projectOwnerId && typeof projectOwnerId === 'string') {
      handovers = handovers.filter(h => h.projectOwnerId === projectOwnerId);
    }

    if (dateFrom && typeof dateFrom === 'string') {
      const fromDate = new Date(dateFrom);
      handovers = handovers.filter(h => {
        const handoverDate = new Date(h.dateCreated);
        return handoverDate >= fromDate;
      });
    }

    if (dateTo && typeof dateTo === 'string') {
      const toDate = new Date(dateTo);
      handovers = handovers.filter(h => {
        const handoverDate = new Date(h.dateCreated);
        return handoverDate <= toDate;
      });
    }

    // Sort by date created (most recent first) - Dataverse already does this
    // but we apply client-side for consistency after filtering
    handovers.sort((a, b) => {
      return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
    });

    return response.status(200).json(handovers);

  } catch (error: any) {
    await handleApiError({
      res: response,
      error,
      title: 'Get Handovers Failure',
      context: {
        authenticatedUserId: request.user.id,
        query: request.query,
      },
    });
  }
}

// Any authenticated user can view handovers
export default withAuth(handler, [
  'tender_admin',
  'scheduler_admin',
  'management_admin',
  'hseq_manager',
  'asphalt_engineer',
  'profiling_engineer',
  'spray_admin',
  'asphalt_foreman',
  'profiling_foreman',
  'spray_foreman',
]);
