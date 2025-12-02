/**
 * Tender Handover Business Logic Handler
 *
 * This module handles all business logic for tender handover operations:
 * - Handover number generation
 * - SharePoint folder structure creation
 * - Site visit calendar event automation (via M365 Group Calendar)
 * - Notifications to project owner and scoping person
 *
 * Architecture:
 * - All calendar automation happens IN-APP (reliable)
 * - Power Automate/Flows only used for notifications
 */

import { TenderHandover, Project } from '../../src/types.js';
import { createFolder } from './sharepoint.js';
import { ValidationError } from './errors.js';
import {
  CalendarService,
  createSiteVisitEvents as createCalendarSiteVisits,
  createProjectCalendarEvent,
  SiteVisitSchedule
} from './calendar.js';
import { sendManagementUpdate } from './teams.js';

/**
 * Generate next handover number in format: HO-YYYY-NNN
 */
export const generateHandoverNumber = (existingHandovers: TenderHandover[]): string => {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `HO-${currentYear}-`;

  // Filter handovers from current year
  const currentYearHandovers = existingHandovers.filter(h =>
    h.handoverNumber.startsWith(yearPrefix)
  );

  // Find highest number
  let maxNumber = 0;
  for (const handover of currentYearHandovers) {
    const numberPart = handover.handoverNumber.split('-')[2];
    const num = parseInt(numberPart, 10);
    if (!isNaN(num) && num > maxNumber) {
      maxNumber = num;
    }
  }

  // Generate next number with zero-padding
  const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
  return `${yearPrefix}${nextNumber}`;
};

/**
 * Generate project number in format: PRJ-YYYY-NNN
 */
export const generateProjectNumber = (existingProjects: Project[]): string => {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `PRJ-${currentYear}-`;

  const currentYearProjects = existingProjects.filter(p =>
    p.projectNumber.startsWith(yearPrefix)
  );

  let maxNumber = 0;
  for (const project of currentYearProjects) {
    const numberPart = project.projectNumber.split('-')[2];
    const num = parseInt(numberPart, 10);
    if (!isNaN(num) && num > maxNumber) {
      maxNumber = num;
    }
  }

  const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
  return `${yearPrefix}${nextNumber}`;
};

/**
 * Validate handover data
 */
export const validateHandover = (handover: Partial<TenderHandover>): void => {
  const required = [
    'clientId',
    'clientName',
    'clientTier',
    'projectName',
    'projectDescription',
    'location',
    'estimatedStartDate',
    'estimatedEndDate',
    'divisionsRequired',
    'projectOwnerId',
    'scopingPersonId',
  ];

  for (const field of required) {
    if (!handover[field as keyof TenderHandover]) {
      throw new ValidationError(`Missing required field: ${field}`, { field });
    }
  }

  // Validate date order
  if (handover.estimatedStartDate && handover.estimatedEndDate) {
    const startDate = new Date(handover.estimatedStartDate);
    const endDate = new Date(handover.estimatedEndDate);

    if (startDate >= endDate) {
      throw new ValidationError('Estimated start date must be before end date', {
        estimatedStartDate: handover.estimatedStartDate,
        estimatedEndDate: handover.estimatedEndDate,
      });
    }
  }

  // Validate at least one division is required
  if (handover.divisionsRequired) {
    const { asphalt, profiling, spray } = handover.divisionsRequired;
    if (!asphalt && !profiling && !spray) {
      throw new ValidationError('At least one division must be required', {
        divisionsRequired: handover.divisionsRequired,
      });
    }
  }
};

/**
 * Create SharePoint folder structure for a new project
 * Structure:
 * - 02_Projects/{ProjectNumber}/
 *   - ScopeReports/
 *   - JobSheets/
 *   - ShiftPlans/
 *   - QAPacks/
 *   - NCRs/
 *   - Incidents/
 *   - Photos/
 */
export const createProjectFolderStructure = async (
  projectNumber: string
): Promise<boolean> => {
  try {
    console.log(`Creating SharePoint folder structure for project ${projectNumber}`);

    const folders = [
      'ScopeReports',
      'JobSheets',
      'ShiftPlans',
      'QAPacks',
      'NCRs',
      'Incidents',
      'Photos',
    ];

    // Create base project folder
    const basePath = `02_Projects/${projectNumber}`;
    await createFolder(basePath);

    // Create subfolders
    for (const folder of folders) {
      await createFolder(`${basePath}/${folder}`);
    }

    console.log(`Successfully created folder structure for ${projectNumber}`);
    return true;
  } catch (error) {
    console.error('Error creating project folder structure:', error);
    return false;
  }
};

/**
 * Calculate site visit dates based on client tier and estimated start date
 */
export const calculateSiteVisitDates = (
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3',
  estimatedStartDate: string
): { visitType: string; scheduledDate: string }[] => {
  const startDate = new Date(estimatedStartDate);
  const visits: { visitType: string; scheduledDate: string }[] = [];

  switch (tier) {
    case 'Tier 1':
      // 3 visits: 14 days, 7 days, 3 days before
      visits.push({
        visitType: '14-Day',
        scheduledDate: new Date(startDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      visits.push({
        visitType: '7-Day',
        scheduledDate: new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      visits.push({
        visitType: '3-Day',
        scheduledDate: new Date(startDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      break;

    case 'Tier 2':
      // 2 visits: 7 days, 3 days before
      visits.push({
        visitType: '7-Day',
        scheduledDate: new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      visits.push({
        visitType: '3-Day',
        scheduledDate: new Date(startDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      break;

    case 'Tier 3':
      // 1 visit: within 72 hours (3 days before)
      visits.push({
        visitType: '72-Hour',
        scheduledDate: new Date(startDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      break;
  }

  return visits;
};

/**
 * Create calendar events for site visits
 * Uses M365 Group Calendar via Microsoft Graph API
 * Returns array of event IDs
 */
export const createSiteVisitEvents = async (
  handover: TenderHandover,
  scopingPersonEmail: string,
  scopingPersonName: string
): Promise<SiteVisitSchedule[]> => {
  try {
    console.log(`Creating site visit calendar events for ${handover.projectName}`);

    const projectDate = new Date(handover.estimatedStartDate);

    // Create calendar events using the CalendarService
    const siteVisits = await createCalendarSiteVisits(
      handover.handoverNumber,
      handover.clientName,
      projectDate,
      handover.clientTier,
      scopingPersonEmail,
      scopingPersonName,
      handover.location
    );

    console.log(`Created ${siteVisits.length} site visit calendar events`);
    return siteVisits;
  } catch (error) {
    console.error('Error creating site visit events:', error);
    // Return empty array on error - don't block handover creation
    return [];
  }
};

/**
 * Create project calendar event (overall project timeline)
 * Called when handover is submitted and project is created
 */
export const createProjectEvent = async (
  handover: TenderHandover,
  projectNumber: string,
  projectOwnerEmail: string,
  projectOwnerName: string
): Promise<string | null> => {
  try {
    console.log(`Creating project calendar event for ${projectNumber}`);

    const eventId = await createProjectCalendarEvent({
      projectNumber,
      projectName: handover.projectName,
      client: handover.clientName,
      clientTier: handover.clientTier,
      location: handover.location,
      startDate: handover.estimatedStartDate,
      endDate: handover.estimatedEndDate,
      projectOwnerEmail,
      projectOwnerName,
    });

    console.log(`Created project calendar event: ${eventId}`);
    return eventId;
  } catch (error) {
    console.error('Error creating project calendar event:', error);
    return null;
  }
};

/**
 * Send notification to project owner and scoping person
 * Uses Teams webhooks for notifications (Power Automate only for complex flows)
 */
export const sendHandoverNotifications = async (
  handover: TenderHandover,
  projectOwnerName: string,
  scopingPersonName: string
): Promise<void> => {
  try {
    console.log(`Sending handover notifications for ${handover.projectName}`);

    // Send Teams notification to management channel
    await sendManagementUpdate(
      `New Project Handover: ${handover.handoverNumber}`,
      `A new project has been handed over and is ready for scoping.`,
      [
        { name: 'Project', value: handover.projectName },
        { name: 'Client', value: `${handover.clientName} (${handover.clientTier})` },
        { name: 'Location', value: handover.location },
        { name: 'Project Owner', value: projectOwnerName },
        { name: 'Scoping Person', value: scopingPersonName },
        { name: 'Est. Start', value: new Date(handover.estimatedStartDate).toLocaleDateString('en-AU') },
        { name: 'Est. End', value: new Date(handover.estimatedEndDate).toLocaleDateString('en-AU') },
      ]
    );

    console.log(`Handover notifications sent successfully`);
  } catch (error) {
    console.error('Error sending handover notifications:', error);
    // Don't throw - notifications are not critical path
  }
};

/**
 * Complete handover workflow
 * Orchestrates all handover automation:
 * 1. Validate handover data
 * 2. Create SharePoint folder structure
 * 3. Create site visit calendar events (in-app automation)
 * 4. Create project calendar event (in-app automation)
 * 5. Send notifications (via Teams webhooks)
 */
export const completeHandoverWorkflow = async (
  handover: TenderHandover,
  projectOwnerEmail: string,
  projectOwnerName: string,
  scopingPersonEmail: string,
  scopingPersonName: string,
  existingProjects: Project[]
): Promise<{
  success: boolean;
  projectNumber?: string;
  projectCalendarEventId?: string;
  siteVisits?: SiteVisitSchedule[];
  errors?: string[];
}> => {
  const errors: string[] = [];

  try {
    // 1. Validate
    validateHandover(handover);

    // 2. Generate project number
    const projectNumber = generateProjectNumber(existingProjects);

    // 3. Create SharePoint folders
    const foldersCreated = await createProjectFolderStructure(projectNumber);
    if (!foldersCreated) {
      errors.push('Failed to create SharePoint folders');
    }

    // 4. Create site visit calendar events
    const siteVisits = await createSiteVisitEvents(
      handover,
      scopingPersonEmail,
      scopingPersonName
    );
    if (siteVisits.length === 0) {
      errors.push('Failed to create site visit calendar events');
    }

    // 5. Create project calendar event
    const projectCalendarEventId = await createProjectEvent(
      handover,
      projectNumber,
      projectOwnerEmail,
      projectOwnerName
    );
    if (!projectCalendarEventId) {
      errors.push('Failed to create project calendar event');
    }

    // 6. Send notifications
    await sendHandoverNotifications(handover, projectOwnerName, scopingPersonName);

    return {
      success: errors.length === 0,
      projectNumber,
      projectCalendarEventId: projectCalendarEventId || undefined,
      siteVisits,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    console.error('Handover workflow failed:', error);
    return {
      success: false,
      errors: [...errors, error.message || 'Unknown error'],
    };
  }
};

export default {
  generateHandoverNumber,
  generateProjectNumber,
  validateHandover,
  createProjectFolderStructure,
  calculateSiteVisitDates,
  createSiteVisitEvents,
  createProjectEvent,
  sendHandoverNotifications,
  completeHandoverWorkflow,
};
