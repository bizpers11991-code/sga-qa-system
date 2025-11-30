/**
 * Project Management Business Logic Handler
 *
 * This module handles all business logic for project operations:
 * - Project number generation
 * - Status calculation and transitions
 * - Progress tracking across divisions
 * - Data aggregation from jobs, QA packs, scope reports
 */

import { Project, Job, FinalQaPack, ScopeReport, DivisionRequest, NonConformanceReport, IncidentReport, ProjectDivision } from '../../src/types';
import { ValidationError } from './errors';
import { JobsData, ScopeReportsData, QAPacksData, NCRsData, IncidentsData, DivisionRequestsData, ProjectsData } from './sharepointData.js';

/**
 * Generate next project number in format: PRJ-YYYY-NNN
 */
export const generateProjectNumber = (existingProjects: Project[]): string => {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `PRJ-${currentYear}-`;

  // Filter projects from current year
  const currentYearProjects = existingProjects.filter(p =>
    p.projectNumber.startsWith(yearPrefix)
  );

  // Find highest number
  let maxNumber = 0;
  for (const project of currentYearProjects) {
    const numberPart = project.projectNumber.split('-')[2];
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
 * Validate project data
 */
export const validateProject = (project: Partial<Project>): void => {
  const required = [
    'projectName',
    'client',
    'clientTier',
    'location',
    'projectOwnerId',
    'projectOwnerDivision',
    'scopingPersonId',
    'estimatedStartDate',
    'estimatedEndDate',
    'divisions',
  ];

  for (const field of required) {
    if (!project[field as keyof Project]) {
      throw new ValidationError(`Missing required field: ${field}`, { field });
    }
  }

  // Validate date order
  if (project.estimatedStartDate && project.estimatedEndDate) {
    const startDate = new Date(project.estimatedStartDate);
    const endDate = new Date(project.estimatedEndDate);

    if (startDate >= endDate) {
      throw new ValidationError('Estimated start date must be before end date', {
        estimatedStartDate: project.estimatedStartDate,
        estimatedEndDate: project.estimatedEndDate,
      });
    }
  }

  // Validate at least one division
  if (project.divisions && project.divisions.length === 0) {
    throw new ValidationError('At least one division must be assigned to the project');
  }
};

/**
 * Initialize divisions array from handover or manual input
 */
export const initializeDivisions = (
  divisionsRequired: { asphalt: boolean; profiling: boolean; spray: boolean }
): ProjectDivision[] => {
  const divisions: ProjectDivision[] = [];

  if (divisionsRequired.asphalt) {
    divisions.push({
      division: 'Asphalt',
      status: 'Pending',
      assignedCrewIds: [],
      scheduledDates: [],
      completedDates: [],
      qaPackIds: [],
    });
  }

  if (divisionsRequired.profiling) {
    divisions.push({
      division: 'Profiling',
      status: 'Pending',
      assignedCrewIds: [],
      scheduledDates: [],
      completedDates: [],
      qaPackIds: [],
    });
  }

  if (divisionsRequired.spray) {
    divisions.push({
      division: 'Spray',
      status: 'Pending',
      assignedCrewIds: [],
      scheduledDates: [],
      completedDates: [],
      qaPackIds: [],
    });
  }

  return divisions;
};

/**
 * Calculate project status based on division statuses and jobs
 */
export const calculateProjectStatus = async (
  project: Project,
  jobs: Job[]
): Promise<Project['status']> => {
  // Check if all divisions are completed
  const allDivisionsCompleted = project.divisions.every(d => d.status === 'Completed');
  if (allDivisionsCompleted) {
    return 'Completed';
  }

  // Check if any job is in progress
  const hasActiveJobs = jobs.some(job => {
    const jobDate = new Date(job.jobDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return jobDate >= yesterday && jobDate <= today;
  });

  if (hasActiveJobs) {
    return 'In Progress';
  }

  // Check if any division has assigned crews
  const hasAssignedCrews = project.divisions.some(d => d.assignedCrewIds.length > 0);
  if (hasAssignedCrews) {
    return 'Scheduled';
  }

  // Check if scope reports are pending
  if (project.scopeReportIds.length === 0) {
    return 'Scoping';
  }

  // Default to scheduled if crews are being arranged
  return 'Scheduled';
};

/**
 * Calculate project progress percentage
 */
export const calculateProjectProgress = (project: Project): {
  overall: number;
  byDivision: { division: string; progress: number }[];
} => {
  const totalDivisions = project.divisions.length;
  const completedDivisions = project.divisions.filter(d => d.status === 'Completed').length;

  const overall = totalDivisions > 0 ? (completedDivisions / totalDivisions) * 100 : 0;

  const byDivision = project.divisions.map(division => {
    // Calculate division progress based on completed dates vs scheduled dates
    const totalScheduled = division.scheduledDates.length;
    const totalCompleted = division.completedDates.length;

    const progress = totalScheduled > 0 ? (totalCompleted / totalScheduled) * 100 : 0;

    return {
      division: division.division,
      progress: Math.round(progress),
    };
  });

  return {
    overall: Math.round(overall),
    byDivision,
  };
};

/**
 * Fetch all related project data (jobs, QA packs, scope reports, etc.)
 */
export const fetchProjectDetails = async (project: Project): Promise<{
  jobs: Job[];
  scopeReports: ScopeReport[];
  qaPacks: FinalQaPack[];
  ncrs: NonConformanceReport[];
  incidents: IncidentReport[];
  divisionRequests: DivisionRequest[];
}> => {
  // Fetch all data in parallel from SharePoint
  const [jobs, scopeReports, qaPacks, ncrs, incidents, divisionRequests] = await Promise.all([
    JobsData.getAll({ projectId: project.id }),
    ScopeReportsData.getAll(project.id),
    QAPacksData.getAll(`ProjectId eq '${project.id}'`),
    NCRsData.getAll(`ProjectId eq '${project.id}'`),
    IncidentsData.getAll(`ProjectId eq '${project.id}'`),
    DivisionRequestsData.getAll({ projectId: project.id }),
  ]);

  return {
    jobs: jobs as Job[],
    scopeReports: scopeReports as ScopeReport[],
    qaPacks: qaPacks as FinalQaPack[],
    ncrs: ncrs as NonConformanceReport[],
    incidents: incidents as IncidentReport[],
    divisionRequests: divisionRequests as DivisionRequest[],
  };
};

/**
 * Link existing job to project
 */
export const linkJobToProject = async (jobId: string, projectId: string): Promise<boolean> => {
  try {
    // Get project from SharePoint
    const project = await ProjectsData.getById(projectId);

    if (!project) {
      return false;
    }

    // Add job ID if not already present
    const jobIds = project.jobIds || [];
    if (!jobIds.includes(jobId)) {
      jobIds.push(jobId);
      await ProjectsData.update(projectId, { jobIds });
    }

    return true;
  } catch (error) {
    console.error('Error linking job to project:', error);
    return false;
  }
};
