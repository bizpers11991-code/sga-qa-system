/**
 * Tender Handover Business Logic Handler
 *
 * This module handles all business logic for tender handover operations:
 * - Handover number generation
 * - SharePoint folder structure creation
 * - Site visit calendar event automation
 * - Notifications to project owner and scoping person
 */

import { TenderHandover } from '../../src/types.js';
import { createFolder } from './sharepoint.js';
import { ValidationError } from './errors.js';

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

    // Note: SharePoint library management would typically be done through
    // the existing sharepoint.ts integration, but this requires extending
    // the library to support project folders.

    // For now, we'll log the action and return success.
    // In production, this should create the actual folders via Graph API.

    const folders = [
      'ScopeReports',
      'JobSheets',
      'ShiftPlans',
      'QAPacks',
      'NCRs',
      'Incidents',
      'Photos',
    ];

    console.log(`Would create folders for ${projectNumber}:`, folders);

    // TODO: Implement actual SharePoint folder creation
    // This requires extending the sharepoint.ts library to support
    // nested folder structures within document libraries

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
 * Returns array of event IDs
 */
export const createSiteVisitEvents = async (
  handover: TenderHandover,
  siteVisits: { visitType: string; scheduledDate: string }[]
): Promise<string[]> => {
  try {
    console.log(`Creating site visit calendar events for ${handover.projectName}`);

    // TODO: Implement Teams/Outlook calendar event creation
    // This requires extending the existing calendar integration
    // For now, we'll return mock event IDs

    const eventIds: string[] = [];

    for (const visit of siteVisits) {
      const eventId = `event_${handover.id}_${visit.visitType}_${Date.now()}`;
      console.log(`Would create ${visit.visitType} site visit on ${visit.scheduledDate}`);
      eventIds.push(eventId);
    }

    return eventIds;
  } catch (error) {
    console.error('Error creating site visit events:', error);
    return [];
  }
};

/**
 * Send notification to project owner and scoping person
 */
export const sendHandoverNotifications = async (
  handover: TenderHandover
): Promise<void> => {
  try {
    console.log(`Sending handover notifications for ${handover.projectName}`);

    // TODO: Implement Teams/Email notification
    // This should notify:
    // 1. Project Owner - You've been assigned as project owner
    // 2. Scoping Person - You've been assigned to complete scope reports

    console.log(`Would notify:
      - Project Owner: ${handover.projectOwnerId}
      - Scoping Person: ${handover.scopingPersonId}
      - Handover Number: ${handover.handoverNumber}
      - Project: ${handover.projectName}
      - Client: ${handover.clientName} (${handover.clientTier})
    `);

    // In production, this should use the existing Teams notification system
    // from api/_lib/teams.ts
  } catch (error) {
    console.error('Error sending handover notifications:', error);
  }
};
