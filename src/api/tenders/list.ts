/**
 * @file src/api/tenders/list.ts
 * @description GET /api/tenders/list - Get all tenders with filters
 * Supports status filtering and pagination
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TendersListService } from '@/lib/sharepoint';
import { checkPermission } from '@/lib/auth/permissions';
import type { SharePointListItem } from '@/lib/sharepoint/types';

// SharePoint field mapping for Tenders
interface TenderSharePointItem extends SharePointListItem {
  HandoverNumber: string;
  ClientName: string;
  ClientTier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  ClientId: string;
  ProjectName: string;
  ProjectDescription: string;
  Location: string;
  EstimatedStartDate: string;
  EstimatedEndDate: string;
  DivisionsRequired: string; // JSON string
  ProjectOwnerId: string;
  ScopingPersonId: string;
  EstimatedArea?: number;
  EstimatedThickness?: number;
  AsphaltPlant?: string;
  SpecialRequirements?: string;
  ContractValue?: number;
  ContractNumber?: string;
  PurchaseOrderNumber?: string;
  Attachments?: string; // JSON string
  DateCreated: string;
  CreatedBy: string;
  Status: 'Draft' | 'Submitted' | 'Active' | 'Completed' | 'On Hold';
}

/**
 * Map SharePoint item to frontend Tender type
 */
function mapSharePointToTender(spItem: TenderSharePointItem) {
  return {
    id: spItem.Id.toString(),
    handoverNumber: spItem.HandoverNumber,
    clientName: spItem.ClientName,
    clientTier: spItem.ClientTier,
    clientId: spItem.ClientId,
    projectName: spItem.ProjectName,
    projectDescription: spItem.ProjectDescription,
    location: spItem.Location,
    estimatedStartDate: spItem.EstimatedStartDate,
    estimatedEndDate: spItem.EstimatedEndDate,
    divisionsRequired: spItem.DivisionsRequired ? JSON.parse(spItem.DivisionsRequired) : {},
    projectOwnerId: spItem.ProjectOwnerId,
    scopingPersonId: spItem.ScopingPersonId,
    estimatedArea: spItem.EstimatedArea,
    estimatedThickness: spItem.EstimatedThickness,
    asphaltPlant: spItem.AsphaltPlant,
    specialRequirements: spItem.SpecialRequirements,
    contractValue: spItem.ContractValue,
    contractNumber: spItem.ContractNumber,
    purchaseOrderNumber: spItem.PurchaseOrderNumber,
    attachments: spItem.Attachments ? JSON.parse(spItem.Attachments) : [],
    dateCreated: spItem.DateCreated,
    createdBy: spItem.CreatedBy,
    status: spItem.Status,
  };
}

/**
 * Handler for GET /api/tenders/list
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Auth check
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock user for now - in production, extract from token
    const mockUser = {
      id: 'user-123',
      role: 'tender_admin' as any,
    };

    // Check view_tender permission
    const permissionResult = checkPermission(mockUser as any, 'view_tender');

    if (!permissionResult.allowed) {
      return res.status(403).json({
        error: 'Forbidden',
        reason: permissionResult.reason,
      });
    }

    // Extract query parameters
    const { status, limit, offset } = req.query;

    // Build filter
    let filter: string | undefined;
    if (status && typeof status === 'string') {
      const validStatuses = ['Draft', 'Submitted', 'Active', 'Completed', 'On Hold'];
      if (validStatuses.includes(status)) {
        filter = `Status eq '${status}'`;
      }
    }

    // Parse pagination params
    const top = limit ? parseInt(limit as string, 10) : 50;
    const skip = offset ? parseInt(offset as string, 10) : 0;

    // Get tenders from SharePoint
    const tenders = await TendersListService.getItems<TenderSharePointItem>({
      filter,
      orderBy: 'DateCreated',
      orderByDescending: true,
      top,
      skip,
    });

    // Map to frontend format
    const mappedTenders = tenders.map(mapSharePointToTender);

    return res.status(200).json({
      tenders: mappedTenders,
      count: mappedTenders.length,
      hasMore: mappedTenders.length === top,
    });
  } catch (error) {
    console.error('Error fetching tenders:', error);

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to fetch tenders',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to fetch tenders',
      message: 'An unknown error occurred',
    });
  }
}

export default handler;
