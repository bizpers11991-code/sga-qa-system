/**
 * Project Management Business Logic Handler
 *
 * This module handles all business logic for project operations:
 * - Project number generation
 * - Status calculation and transitions
 * - Progress tracking across divisions
 * - Data aggregation from jobs, QA packs, scope reports
 */

import { Project, Job, FinalQaPack, ScopeReport, DivisionRequest, NonConformanceReport, IncidentReport, ProjectDivision } from '../../src/types.js';
import { ValidationError } from './errors.js';
import { getRedisInstance } from './redis.js';

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
  const redis = getRedisInstance();

  // Fetch jobs
  const jobs: Job[] = [];
  for (const jobId of project.jobIds) {
    const jobKey = `job:${jobId}`;
    const jobHash = await redis.hgetall(jobKey);

    if (jobHash && Object.keys(jobHash).length > 0) {
      const job: Partial<Job> = {};
      for (const [key, value] of Object.entries(jobHash)) {
        try {
          job[key as keyof Job] = JSON.parse(value as string);
        } catch {
          (job as any)[key] = value;
        }
      }
      jobs.push(job as Job);
    }
  }

  // Fetch scope reports
  const scopeReports: ScopeReport[] = [];
  for (const reportId of project.scopeReportIds) {
    const reportKey = `scopereport:${reportId}`;
    const reportHash = await redis.hgetall(reportKey);

    if (reportHash && Object.keys(reportHash).length > 0) {
      const report: Partial<ScopeReport> = {};
      for (const [key, value] of Object.entries(reportHash)) {
        try {
          report[key as keyof ScopeReport] = JSON.parse(value as string);
        } catch {
          (report as any)[key] = value;
        }
      }
      scopeReports.push(report as ScopeReport);
    }
  }

  // Fetch QA packs
  const qaPacks: FinalQaPack[] = [];
  if (project.qaPackIds) {
    for (const qaPackId of project.qaPackIds) {
      const qaPackKey = `qapack:${qaPackId}`;
      const qaPackHash = await redis.hgetall(qaPackKey);

      if (qaPackHash && Object.keys(qaPackHash).length > 0) {
        const qaPack: Partial<FinalQaPack> = {};
        for (const [key, value] of Object.entries(qaPackHash)) {
          try {
            qaPack[key as keyof FinalQaPack] = JSON.parse(value as string);
          } catch {
            (qaPack as any)[key] = value;
          }
        }
        qaPacks.push(qaPack as FinalQaPack);
      }
    }
  }

  // Fetch NCRs
  const ncrs: NonConformanceReport[] = [];
  if (project.ncrIds) {
    for (const ncrId of project.ncrIds) {
      const ncrKey = `ncr:${ncrId}`;
      const ncrHash = await redis.hgetall(ncrKey);

      if (ncrHash && Object.keys(ncrHash).length > 0) {
        const ncr: Partial<NonConformanceReport> = {};
        for (const [key, value] of Object.entries(ncrHash)) {
          try {
            ncr[key as keyof NonConformanceReport] = JSON.parse(value as string);
          } catch {
            (ncr as any)[key] = value;
          }
        }
        ncrs.push(ncr as NonConformanceReport);
      }
    }
  }

  // Fetch incidents
  const incidents: IncidentReport[] = [];
  if (project.incidentIds) {
    for (const incidentId of project.incidentIds) {
      const incidentKey = `incident:${incidentId}`;
      const incidentHash = await redis.hgetall(incidentKey);

      if (incidentHash && Object.keys(incidentHash).length > 0) {
        const incident: Partial<IncidentReport> = {};
        for (const [key, value] of Object.entries(incidentHash)) {
          try {
            incident[key as keyof IncidentReport] = JSON.parse(value as string);
          } catch {
            (incident as any)[key] = value;
          }
        }
        incidents.push(incident as IncidentReport);
      }
    }
  }

  // Fetch division requests
  const divisionRequests: DivisionRequest[] = [];
  const allRequestIds = await redis.smembers('divisionrequests:index');

  for (const requestId of allRequestIds) {
    const requestKey = `divisionrequest:${requestId}`;
    const requestHash = await redis.hgetall(requestKey);

    if (requestHash && Object.keys(requestHash).length > 0) {
      const request: Partial<DivisionRequest> = {};
      for (const [key, value] of Object.entries(requestHash)) {
        try {
          request[key as keyof DivisionRequest] = JSON.parse(value as string);
        } catch {
          (request as any)[key] = value;
        }
      }

      // Only include requests for this project
      if ((request as DivisionRequest).projectId === project.id) {
        divisionRequests.push(request as DivisionRequest);
      }
    }
  }

  return {
    jobs,
    scopeReports,
    qaPacks,
    ncrs,
    incidents,
    divisionRequests,
  };
};

/**
 * Link existing job to project
 */
export const linkJobToProject = async (jobId: string, projectId: string): Promise<boolean> => {
  try {
    const redis = getRedisInstance();

    // Get project
    const projectKey = `project:${projectId}`;
    const projectHash = await redis.hgetall(projectKey);

    if (!projectHash || Object.keys(projectHash).length === 0) {
      return false;
    }

    // Parse project
    const project: Partial<Project> = {};
    for (const [key, value] of Object.entries(projectHash)) {
      try {
        project[key as keyof Project] = JSON.parse(value as string);
      } catch {
        (project as any)[key] = value;
      }
    }

    // Add job ID if not already present
    const jobIds = (project as Project).jobIds || [];
    if (!jobIds.includes(jobId)) {
      jobIds.push(jobId);

      // Update project
      await redis.hset(projectKey, 'jobIds', JSON.stringify(jobIds));
    }

    return true;
  } catch (error) {
    console.error('Error linking job to project:', error);
    return false;
  }
};
