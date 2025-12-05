/**
 * @file src/api/tenders/approve.ts
 * @description POST /api/tenders/approve - Approve tender and convert to project
 * Approves tender, creates new project in Projects list
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TendersListService, ProjectsListService } from '@/lib/sharepoint';
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

// SharePoint field mapping for Projects
interface ProjectSharePointItem extends SharePointListItem {
  ProjectNumber: string;
  HandoverId: string;
  ProjectName: string;
  Client: string;
  ClientTier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  Location: string;
  ProjectOwnerId: string;
  ProjectOwnerDivision: 'Asphalt' | 'Profiling' | 'Spray';
  ScopingPersonId: string;
  EstimatedStartDate: string;
  EstimatedEndDate: string;
  ActualStartDate?: string;
  ActualEndDate?: string;
  Status: 'Scoping' | 'Scheduled' | 'In Progress' | 'QA Review' | 'Completed' | 'On Hold';
  Divisions?: string;
  JobIds?: string;
  ScopeReportIds?: string;
}

/**
 * Generate project number in format: PRJ-YYYY-NNNN
 */
async function generateProjectNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PRJ-${year}-`;

  // Get all projects from this year
  const filter = `startswith(ProjectNumber, '${prefix}')`;
  const projects = await ProjectsListService.getItems<ProjectSharePointItem>({
    filter,
    select: ['ProjectNumber'],
    orderBy: 'ProjectNumber',
    orderByDescending: true,
    top: 1,
  });

  if (projects.length === 0) {
    return `${prefix}0001`;
  }

  // Extract number and increment
  const lastNumber = projects[0].ProjectNumber.split('-')[2];
  const nextNumber = (parseInt(lastNumber, 10) + 1).toString().padStart(4, '0');

  return `${prefix}${nextNumber}`;
}

/**
 * Determine primary division for project owner
 */
function getPrimaryDivision(divisionsRequired: any): 'Asphalt' | 'Profiling' | 'Spray' {
  if (divisionsRequired.asphalt) return 'Asphalt';
  if (divisionsRequired.profiling) return 'Profiling';
  if (divisionsRequired.spray) return 'Spray';
  return 'Asphalt'; // Default
}

/**
 * Handler for POST /api/tenders/approve
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

    // Check approve_tender permission
    const permissionResult = checkPermission(mockUser as any, 'approve_tender');

    if (!permissionResult.allowed) {
      return res.status(403).json({
        error: 'Forbidden',
        reason: permissionResult.reason,
      });
    }

    // Extract tender ID
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Tender ID is required' });
    }

    const tenderId = parseInt(id, 10);
    if (isNaN(tenderId)) {
      return res.status(400).json({ error: 'Invalid tender ID' });
    }

    // Get tender from SharePoint
    const tender = await TendersListService.getItem<TenderSharePointItem>(tenderId);

    // Check tender status
    if (tender.Status === 'Active') {
      return res.status(400).json({ error: 'Tender is already approved' });
    }

    // Generate project number
    const projectNumber = await generateProjectNumber();

    // Parse divisions required
    const divisionsRequired = JSON.parse(tender.DivisionsRequired);

    // Build divisions array for project
    const projectDivisions = [];
    if (divisionsRequired.asphalt) {
      projectDivisions.push({
        division: 'Asphalt',
        status: 'Pending',
        assignedCrewIds: [],
        scheduledDates: [],
        completedDates: [],
        qaPackIds: [],
      });
    }
    if (divisionsRequired.profiling) {
      projectDivisions.push({
        division: 'Profiling',
        status: 'Pending',
        assignedCrewIds: [],
        scheduledDates: [],
        completedDates: [],
        qaPackIds: [],
      });
    }
    if (divisionsRequired.spray) {
      projectDivisions.push({
        division: 'Spray',
        status: 'Pending',
        assignedCrewIds: [],
        scheduledDates: [],
        completedDates: [],
        qaPackIds: [],
      });
    }

    // Create project data
    const projectData = {
      Title: projectNumber, // Title is required by SharePoint
      ProjectNumber: projectNumber,
      HandoverId: tender.Id.toString(),
      ProjectName: tender.ProjectName,
      Client: tender.ClientName,
      ClientTier: tender.ClientTier,
      Location: tender.Location,
      ProjectOwnerId: tender.ProjectOwnerId,
      ProjectOwnerDivision: getPrimaryDivision(divisionsRequired),
      ScopingPersonId: tender.ScopingPersonId,
      EstimatedStartDate: tender.EstimatedStartDate,
      EstimatedEndDate: tender.EstimatedEndDate,
      Status: 'Scoping',
      Divisions: JSON.stringify(projectDivisions),
      JobIds: JSON.stringify([]),
      ScopeReportIds: JSON.stringify([]),
    };

    // Create project in SharePoint
    const createdProject = await ProjectsListService.createItem<ProjectSharePointItem>(projectData);

    // Update tender status to Active
    await TendersListService.updateItem(tenderId, {
      Status: 'Active',
    });

    // Fetch updated tender
    const updatedTender = await TendersListService.getItem<TenderSharePointItem>(tenderId);

    return res.status(200).json({
      message: 'Tender approved and project created successfully',
      tender: {
        id: updatedTender.Id.toString(),
        handoverNumber: updatedTender.HandoverNumber,
        status: updatedTender.Status,
      },
      project: {
        id: createdProject.Id.toString(),
        projectNumber: createdProject.ProjectNumber,
        projectName: createdProject.ProjectName,
        status: createdProject.Status,
      },
    });
  } catch (error) {
    console.error('Error approving tender:', error);

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to approve tender',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to approve tender',
      message: 'An unknown error occurred',
    });
  }
}

export default handler;
