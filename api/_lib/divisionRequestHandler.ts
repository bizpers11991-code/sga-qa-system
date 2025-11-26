/**
 * Division Request Business Logic Handler
 *
 * This module handles all business logic for cross-division coordination:
 * - Request number generation
 * - Workflow automation (notifications, calendar events)
 * - Crew assignment
 * - QA pack linking
 */

import { DivisionRequest, Project } from '../../src/types.js';
import { ValidationError } from './errors.js';

/**
 * Generate division request number in format: DR-YYYY-NNN
 */
export const generateRequestNumber = (existingRequests: DivisionRequest[]): string => {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `DR-${currentYear}-`;

  // Filter requests from current year
  const currentYearRequests = existingRequests.filter(r =>
    r.requestNumber.startsWith(yearPrefix)
  );

  // Find highest number
  let maxNumber = 0;
  for (const request of currentYearRequests) {
    const numberPart = request.requestNumber.split('-')[2];
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
 * Validate division request data
 */
export const validateDivisionRequest = (request: Partial<DivisionRequest>): void => {
  const required = [
    'projectId',
    'requestedDivision',
    'requestedTo',
    'workDescription',
    'location',
    'requestedDates',
  ];

  for (const field of required) {
    if (!request[field as keyof DivisionRequest]) {
      throw new ValidationError(`Missing required field: ${field}`, { field });
    }
  }

  // Validate division
  const validDivisions: DivisionRequest['requestedDivision'][] = ['Asphalt', 'Profiling', 'Spray'];
  if (request.requestedDivision && !validDivisions.includes(request.requestedDivision)) {
    throw new ValidationError('Invalid division', {
      requestedDivision: request.requestedDivision,
      validDivisions,
    });
  }

  // Validate dates array
  if (request.requestedDates && request.requestedDates.length === 0) {
    throw new ValidationError('At least one requested date is required');
  }
};

/**
 * Auto-assign division engineer based on division
 * In production, this would query Redis for engineers by division
 */
export const getDefaultEngineerForDivision = (
  division: 'Asphalt' | 'Profiling' | 'Spray'
): string => {
  // Placeholder - in production, query Redis for engineers by division
  // and return the first available or default engineer
  const defaultEngineers = {
    Asphalt: 'asphalt_engineer_001',
    Profiling: 'profiling_engineer_001',
    Spray: 'spray_admin_001',
  };

  return defaultEngineers[division] || 'default_engineer';
};

/**
 * Send notification to division engineer about new request
 */
export const notifyDivisionEngineer = async (
  request: DivisionRequest,
  project: Project
): Promise<void> => {
  try {
    console.log(`Notifying division engineer about request ${request.requestNumber}`);

    // TODO: Implement Teams/Email notification
    console.log(`Would notify:
      - Division Engineer: ${request.requestedTo}
      - Request Number: ${request.requestNumber}
      - Project: ${project.projectName}
      - Division: ${request.requestedDivision}
      - Work: ${request.workDescription}
      - Dates: ${request.requestedDates.join(', ')}
    `);

  } catch (error) {
    console.error('Error notifying division engineer:', error);
  }
};

/**
 * Send notification to project owner about request response
 */
export const notifyProjectOwner = async (
  request: DivisionRequest,
  project: Project,
  responseType: 'accept' | 'reject'
): Promise<void> => {
  try {
    console.log(`Notifying project owner about ${responseType}ed request ${request.requestNumber}`);

    // TODO: Implement Teams/Email notification
    console.log(`Would notify:
      - Project Owner: ${project.projectOwnerId}
      - Request Number: ${request.requestNumber}
      - Project: ${project.projectName}
      - Division: ${request.requestedDivision}
      - Response: ${responseType}
      - Notes: ${request.responseNotes || 'None'}
    `);

  } catch (error) {
    console.error('Error notifying project owner:', error);
  }
};

/**
 * Create calendar events for accepted division request
 */
export const createDivisionCalendarEvents = async (
  request: DivisionRequest,
  project: Project
): Promise<string[]> => {
  try {
    console.log(`Creating calendar events for request ${request.requestNumber}`);

    // TODO: Implement Teams/Outlook calendar event creation
    const eventIds: string[] = [];

    for (const date of request.confirmedDates || []) {
      const eventId = `event_${request.id}_${date}_${Date.now()}`;
      console.log(`Would create calendar event for ${request.requestedDivision} crew on ${date}`);
      eventIds.push(eventId);
    }

    return eventIds;
  } catch (error) {
    console.error('Error creating division calendar events:', error);
    return [];
  }
};

/**
 * Create job entries for accepted division request
 * These jobs will be assigned to the division foreman
 */
export const createJobsForRequest = async (
  request: DivisionRequest,
  project: Project
): Promise<string[]> => {
  try {
    console.log(`Creating jobs for request ${request.requestNumber}`);

    // TODO: Implement job creation
    // This should create Job entities for each confirmed date
    // Jobs should be linked to the project and assigned to the foreman

    const jobIds: string[] = [];

    for (const date of request.confirmedDates || []) {
      const jobId = `job_${request.id}_${date}_${Date.now()}`;
      console.log(`Would create job for ${request.requestedDivision} on ${date}`);
      console.log(`  - Project: ${project.projectName}`);
      console.log(`  - Foreman: ${request.assignedForemanId}`);
      console.log(`  - Crew: ${request.assignedCrewId}`);
      jobIds.push(jobId);
    }

    return jobIds;
  } catch (error) {
    console.error('Error creating jobs for request:', error);
    return [];
  }
};

/**
 * Link QA pack to division request and project
 */
export const linkQAPackToRequest = async (
  request: DivisionRequest,
  qaPackId: string,
  project: Project
): Promise<void> => {
  try {
    console.log(`Linking QA pack ${qaPackId} to request ${request.requestNumber}`);

    // TODO: Implement QA pack linking
    // This should:
    // 1. Update the division request with qaPackId
    // 2. Add qaPackId to the project's qaPackIds array
    // 3. Update the appropriate division in project.divisions

    console.log(`Would link QA pack to:
      - Request: ${request.requestNumber}
      - Project: ${project.projectNumber}
      - Division: ${request.requestedDivision}
    `);

  } catch (error) {
    console.error('Error linking QA pack to request:', error);
  }
};

/**
 * Update project division status after request completion
 */
export const updateProjectDivisionStatus = async (
  projectId: string,
  division: 'Asphalt' | 'Profiling' | 'Spray',
  qaPackId: string
): Promise<void> => {
  try {
    console.log(`Updating project ${projectId} division ${division} status`);

    // TODO: Implement project division update
    // This should update the specific division in project.divisions array
    // Add qaPackId to the division's qaPackIds
    // Potentially update division status to "Completed"

  } catch (error) {
    console.error('Error updating project division status:', error);
  }
};
