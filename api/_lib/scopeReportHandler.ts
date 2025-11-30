/**
 * Scope Report Business Logic Handler
 *
 * This module handles all business logic for scope report operations:
 * - Report number generation
 * - Photo processing and upload
 * - GPS coordinate validation
 * - Notifications and Teams integration
 */

import { ScopeReport, Project } from '../../src/types';
import { ValidationError } from './errors';
import { ProjectsData } from './sharepointData.js';

/**
 * Generate scope report number in format: SCR-YYYY-PNN-VV
 * Where:
 * - YYYY = year
 * - PNN = project number (last 3 digits)
 * - VV = visit number (01, 02, 03)
 */
export const generateScopeReportNumber = (
  projectNumber: string,
  visitNumber: number
): string => {
  const currentYear = new Date().getFullYear();
  const projectDigits = projectNumber.split('-')[2]; // Get NNN from PRJ-YYYY-NNN

  const visitDigits = visitNumber.toString().padStart(2, '0');

  return `SCR-${currentYear}-${projectDigits}-${visitDigits}`;
};

/**
 * Validate scope report data
 */
export const validateScopeReport = (report: Partial<ScopeReport>): void => {
  const required = [
    'projectId',
    'visitNumber',
    'visitType',
    'scheduledDate',
    'actualDate',
    'completedBy',
    'siteAccessibility',
    'surfaceCondition',
    'measurements',
    'trafficManagement',
    'utilities',
    'hazards',
    'recommendations',
    'estimatedDuration',
    'signature',
    'signedAt',
  ];

  for (const field of required) {
    if (!report[field as keyof ScopeReport]) {
      throw new ValidationError(`Missing required field: ${field}`, { field });
    }
  }

  // Validate visit number
  if (report.visitNumber && (report.visitNumber < 1 || report.visitNumber > 3)) {
    throw new ValidationError('Visit number must be between 1 and 3', {
      visitNumber: report.visitNumber,
    });
  }

  // Validate measurements
  if (report.measurements) {
    const { area, depth } = report.measurements;
    if (area <= 0 || depth <= 0) {
      throw new ValidationError('Area and depth must be positive numbers', {
        area,
        depth,
      });
    }
  }
};

/**
 * Compress photo data for storage
 * (Placeholder - actual implementation would use image compression library)
 */
export const compressPhoto = async (photoData: string): Promise<string> => {
  // In production, this would:
  // 1. Decode base64 to buffer
  // 2. Use sharp or similar to compress
  // 3. Re-encode to base64
  // For now, just return original
  return photoData;
};

/**
 * Validate GPS coordinates
 */
export const validateGPSCoordinates = (
  latitude: number,
  longitude: number
): boolean => {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

/**
 * Update project status after scope report submission
 */
export const updateProjectAfterScopeReport = async (
  projectId: string,
  reportId: string
): Promise<void> => {
  try {
    // Fetch project from SharePoint
    const project = await ProjectsData.getById(projectId);

    if (!project) {
      console.error(`Project ${projectId} not found`);
      return;
    }

    // Add report ID to project
    const scopeReportIds = project.scopeReportIds || [];
    if (!scopeReportIds.includes(reportId)) {
      scopeReportIds.push(reportId);

      const updates: Partial<Project> = { scopeReportIds };

      // Update project status if currently in "Scoping"
      if (project.status === 'Scoping') {
        updates.status = 'Scheduled';
      }

      await ProjectsData.update(projectId, updates);
    }

  } catch (error) {
    console.error('Error updating project after scope report:', error);
  }
};

/**
 * Send scope report notification to project owner
 */
export const sendScopeReportNotification = async (
  report: ScopeReport,
  project: Project
): Promise<void> => {
  try {
    console.log(`Sending scope report notification for ${report.reportNumber}`);

    // TODO: Implement Teams/Email notification
    // This should notify the project owner that a new scope report has been submitted

    console.log(`Would notify:
      - Project Owner: ${project.projectOwnerId}
      - Report Number: ${report.reportNumber}
      - Project: ${project.projectName}
      - Visit Type: ${report.visitType}
      - Completed By: ${report.completedBy}
    `);

  } catch (error) {
    console.error('Error sending scope report notification:', error);
  }
};

/**
 * Post scope report summary to Teams channel
 */
export const postScopeReportToTeams = async (
  report: ScopeReport,
  project: Project
): Promise<void> => {
  try {
    console.log(`Posting scope report summary to Teams for ${report.reportNumber}`);

    // TODO: Implement Teams adaptive card posting
    // This should post a summary card to the project's Teams channel

    const summary = {
      reportNumber: report.reportNumber,
      projectName: project.projectName,
      visitType: report.visitType,
      siteAccessible: report.siteAccessibility.accessible,
      surfaceCondition: report.surfaceCondition.currentCondition,
      hazardsIdentified: report.hazards.identified,
      recommendations: report.recommendations,
      estimatedDuration: report.estimatedDuration,
    };

    console.log('Teams summary:', JSON.stringify(summary, null, 2));

  } catch (error) {
    console.error('Error posting scope report to Teams:', error);
  }
};

/**
 * Calculate expected visit type based on tier and visit number
 */
export const getExpectedVisitType = (
  clientTier: 'Tier 1' | 'Tier 2' | 'Tier 3',
  visitNumber: number
): string => {
  switch (clientTier) {
    case 'Tier 1':
      if (visitNumber === 1) return '14-Day';
      if (visitNumber === 2) return '7-Day';
      if (visitNumber === 3) return '3-Day';
      break;

    case 'Tier 2':
      if (visitNumber === 1) return '7-Day';
      if (visitNumber === 2) return '3-Day';
      break;

    case 'Tier 3':
      return '72-Hour';
  }

  return '72-Hour';
};
