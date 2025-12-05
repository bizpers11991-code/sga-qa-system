/**
 * @file src/api/tenders/create.ts
 * @description POST /api/tenders/create - Create new tender handover
 * Validates input, auto-generates handover number, creates in SharePoint
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TendersListService } from '@/lib/sharepoint';
import { checkPermission } from '@/lib/auth/permissions';
import { TenderHandoverCreateSchema } from '@/lib/validation/schemas';
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
 * Generate handover number in format: TH-YYYY-NNNN
 */
async function generateHandoverNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TH-${year}-`;

  // Get all tenders from this year
  const filter = `startswith(HandoverNumber, '${prefix}')`;
  const tenders = await TendersListService.getItems<TenderSharePointItem>({
    filter,
    select: ['HandoverNumber'],
    orderBy: 'HandoverNumber',
    orderByDescending: true,
    top: 1,
  });

  if (tenders.length === 0) {
    return `${prefix}0001`;
  }

  // Extract number and increment
  const lastNumber = tenders[0].HandoverNumber.split('-')[2];
  const nextNumber = (parseInt(lastNumber, 10) + 1).toString().padStart(4, '0');

  return `${prefix}${nextNumber}`;
}

/**
 * Handler for POST /api/tenders/create
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
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

    // Check create_tender permission
    const permissionResult = checkPermission(mockUser as any, 'create_tender');

    if (!permissionResult.allowed) {
      return res.status(403).json({
        error: 'Forbidden',
        reason: permissionResult.reason,
      });
    }

    // Validate request body
    const validationResult = TenderHandoverCreateSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const data = validationResult.data;

    // Generate handover number
    const handoverNumber = await generateHandoverNumber();

    // Map to SharePoint fields
    const spData = {
      Title: handoverNumber, // Title is required by SharePoint
      HandoverNumber: handoverNumber,
      ClientName: data.clientName,
      ClientTier: data.clientTier,
      ClientId: data.clientId,
      ProjectName: data.projectName,
      ProjectDescription: data.projectDescription,
      Location: data.location,
      EstimatedStartDate: data.estimatedStartDate,
      EstimatedEndDate: data.estimatedEndDate,
      DivisionsRequired: JSON.stringify(data.divisionsRequired),
      ProjectOwnerId: data.projectOwnerId,
      ScopingPersonId: data.scopingPersonId,
      EstimatedArea: data.estimatedArea,
      EstimatedThickness: data.estimatedThickness,
      AsphaltPlant: data.asphaltPlant,
      SpecialRequirements: data.specialRequirements,
      ContractValue: data.contractValue,
      ContractNumber: data.contractNumber,
      PurchaseOrderNumber: data.purchaseOrderNumber,
      Attachments: data.attachments ? JSON.stringify(data.attachments) : undefined,
      DateCreated: new Date().toISOString(),
      CreatedBy: mockUser.id,
      Status: 'Draft',
    };

    // Create in SharePoint
    const createdItem = await TendersListService.createItem<TenderSharePointItem>(spData);

    // Map back to frontend format
    const tender = {
      id: createdItem.Id.toString(),
      handoverNumber: createdItem.HandoverNumber,
      clientName: createdItem.ClientName,
      clientTier: createdItem.ClientTier,
      clientId: createdItem.ClientId,
      projectName: createdItem.ProjectName,
      projectDescription: createdItem.ProjectDescription,
      location: createdItem.Location,
      estimatedStartDate: createdItem.EstimatedStartDate,
      estimatedEndDate: createdItem.EstimatedEndDate,
      divisionsRequired: JSON.parse(createdItem.DivisionsRequired),
      projectOwnerId: createdItem.ProjectOwnerId,
      scopingPersonId: createdItem.ScopingPersonId,
      estimatedArea: createdItem.EstimatedArea,
      estimatedThickness: createdItem.EstimatedThickness,
      asphaltPlant: createdItem.AsphaltPlant,
      specialRequirements: createdItem.SpecialRequirements,
      contractValue: createdItem.ContractValue,
      contractNumber: createdItem.ContractNumber,
      purchaseOrderNumber: createdItem.PurchaseOrderNumber,
      attachments: createdItem.Attachments ? JSON.parse(createdItem.Attachments) : [],
      dateCreated: createdItem.DateCreated,
      createdBy: createdItem.CreatedBy,
      status: createdItem.Status,
    };

    return res.status(201).json({
      message: 'Tender created successfully',
      tender,
    });
  } catch (error) {
    console.error('Error creating tender:', error);

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to create tender',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to create tender',
      message: 'An unknown error occurred',
    });
  }
}

export default handler;
