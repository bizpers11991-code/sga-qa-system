/**
 * @file src/api/tenders/update.ts
 * @description PUT /api/tenders/update - Update existing tender
 * Updates tender handover details
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TendersListService } from '@/lib/sharepoint';
import { checkPermission } from '@/lib/auth/permissions';
import { TenderHandoverUpdateSchema } from '@/lib/validation/schemas';
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
 * Handler for PUT /api/tenders/update
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') {
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

    // Check edit_tender permission
    const permissionResult = checkPermission(mockUser as any, 'edit_tender');

    if (!permissionResult.allowed) {
      return res.status(403).json({
        error: 'Forbidden',
        reason: permissionResult.reason,
      });
    }

    // Extract tender ID
    const { id, ...updateData } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Tender ID is required' });
    }

    const tenderId = parseInt(id, 10);
    if (isNaN(tenderId)) {
      return res.status(400).json({ error: 'Invalid tender ID' });
    }

    // Validate update data
    const validationResult = TenderHandoverUpdateSchema.safeParse(updateData);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const data = validationResult.data;

    // Check if tender exists
    const exists = await TendersListService.itemExists(tenderId);
    if (!exists) {
      return res.status(404).json({ error: 'Tender not found' });
    }

    // Map to SharePoint fields
    const spUpdateData: any = {};

    if (data.clientName !== undefined) spUpdateData.ClientName = data.clientName;
    if (data.clientTier !== undefined) spUpdateData.ClientTier = data.clientTier;
    if (data.clientId !== undefined) spUpdateData.ClientId = data.clientId;
    if (data.projectName !== undefined) spUpdateData.ProjectName = data.projectName;
    if (data.projectDescription !== undefined) spUpdateData.ProjectDescription = data.projectDescription;
    if (data.location !== undefined) spUpdateData.Location = data.location;
    if (data.estimatedStartDate !== undefined) spUpdateData.EstimatedStartDate = data.estimatedStartDate;
    if (data.estimatedEndDate !== undefined) spUpdateData.EstimatedEndDate = data.estimatedEndDate;
    if (data.divisionsRequired !== undefined) spUpdateData.DivisionsRequired = JSON.stringify(data.divisionsRequired);
    if (data.projectOwnerId !== undefined) spUpdateData.ProjectOwnerId = data.projectOwnerId;
    if (data.scopingPersonId !== undefined) spUpdateData.ScopingPersonId = data.scopingPersonId;
    if (data.estimatedArea !== undefined) spUpdateData.EstimatedArea = data.estimatedArea;
    if (data.estimatedThickness !== undefined) spUpdateData.EstimatedThickness = data.estimatedThickness;
    if (data.asphaltPlant !== undefined) spUpdateData.AsphaltPlant = data.asphaltPlant;
    if (data.specialRequirements !== undefined) spUpdateData.SpecialRequirements = data.specialRequirements;
    if (data.contractValue !== undefined) spUpdateData.ContractValue = data.contractValue;
    if (data.contractNumber !== undefined) spUpdateData.ContractNumber = data.contractNumber;
    if (data.purchaseOrderNumber !== undefined) spUpdateData.PurchaseOrderNumber = data.purchaseOrderNumber;
    if (data.attachments !== undefined) spUpdateData.Attachments = JSON.stringify(data.attachments);

    // Update in SharePoint
    await TendersListService.updateItem(tenderId, spUpdateData);

    // Fetch updated item
    const updatedItem = await TendersListService.getItem<TenderSharePointItem>(tenderId);

    // Map back to frontend format
    const tender = {
      id: updatedItem.Id.toString(),
      handoverNumber: updatedItem.HandoverNumber,
      clientName: updatedItem.ClientName,
      clientTier: updatedItem.ClientTier,
      clientId: updatedItem.ClientId,
      projectName: updatedItem.ProjectName,
      projectDescription: updatedItem.ProjectDescription,
      location: updatedItem.Location,
      estimatedStartDate: updatedItem.EstimatedStartDate,
      estimatedEndDate: updatedItem.EstimatedEndDate,
      divisionsRequired: JSON.parse(updatedItem.DivisionsRequired),
      projectOwnerId: updatedItem.ProjectOwnerId,
      scopingPersonId: updatedItem.ScopingPersonId,
      estimatedArea: updatedItem.EstimatedArea,
      estimatedThickness: updatedItem.EstimatedThickness,
      asphaltPlant: updatedItem.AsphaltPlant,
      specialRequirements: updatedItem.SpecialRequirements,
      contractValue: updatedItem.ContractValue,
      contractNumber: updatedItem.ContractNumber,
      purchaseOrderNumber: updatedItem.PurchaseOrderNumber,
      attachments: updatedItem.Attachments ? JSON.parse(updatedItem.Attachments) : [],
      dateCreated: updatedItem.DateCreated,
      createdBy: updatedItem.CreatedBy,
      status: updatedItem.Status,
    };

    return res.status(200).json({
      message: 'Tender updated successfully',
      tender,
    });
  } catch (error) {
    console.error('Error updating tender:', error);

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to update tender',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to update tender',
      message: 'An unknown error occurred',
    });
  }
}

export default handler;
