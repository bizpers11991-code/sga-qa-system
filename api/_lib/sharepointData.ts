/**
 * SharePoint Data Layer for SGA QA System
 *
 * This module provides all data operations using SharePoint Lists.
 * Replaces Redis for data storage - SharePoint is the ONLY backend.
 *
 * SharePoint Lists Required:
 * - Jobs
 * - Projects
 * - Tenders (Handovers)
 * - ScopeReports
 * - DivisionRequests
 * - QAPacks
 * - Incidents
 * - NCRs
 * - Foremen
 * - Resources
 * - ITPTemplates
 * - SamplingPlans
 * - Drafts
 * - Notifications
 */

import { createListService, SharePointListService } from '../../src/lib/sharepoint/lists.js';
import type { SharePointListItem, SharePointQueryOptions } from '../../src/lib/sharepoint/types.js';
import type {
  Job,
  Project,
  TenderHandover,
  ScopeReport,
  DivisionRequest,
  IncidentReport,
  NonConformanceReport,
  Foreman,
} from '../../src/types';

// ============================================================================
// LIST SERVICES
// ============================================================================

// Create singleton services for each list
const services = {
  jobs: createListService('Jobs'),
  projects: createListService('Projects'),
  tenders: createListService('Tenders'),
  scopeReports: createListService('ScopeReports'),
  divisionRequests: createListService('DivisionRequests'),
  qaPacks: createListService('QAPacks'),
  incidents: createListService('Incidents'),
  ncrs: createListService('NCRs'),
  crewMembers: createListService('CrewMembers'), // Unified crew list (replaces Foremen)
  resources: createListService('Resources'),
  itpTemplates: createListService('ITPTemplates'),
  samplingPlans: createListService('SamplingPlans'),
  drafts: createListService('Drafts'),
  notifications: createListService('Notifications'),
  dailyReports: createListService('DailyReports'),
  activityLog: createListService('ActivityLog'),
};

// ============================================================================
// TYPE DEFINITIONS FOR SHAREPOINT ITEMS
// ============================================================================

/**
 * SharePoint list item with our custom fields
 * SharePoint uses Title as primary field, Id as auto-generated number
 */
interface SPJob extends SharePointListItem {
  Title: string; // Job Number (e.g., "JOB-2025-001")
  JobNo: string;
  Client: string;
  Division: string;
  ProjectName: string;
  Location: string;
  ForemanId: string;
  ForemanEmail: string;
  JobDate: string;
  DueDate: string;
  Status: string;
  WorkDescription: string;
  Area?: number;
  Thickness?: number;
  ClientTier?: string;
  QaSpec?: string;
  ProjectId?: string;
  AssignedCrewId?: string;
  JobSheetData?: string; // JSON string
  AsphaltDetails?: string; // JSON string
  ProfilingDetails?: string; // JSON string
}

interface SPProject extends SharePointListItem {
  Title: string; // Project Number
  ProjectNumber: string;
  HandoverId: string;
  ProjectName: string;
  Client: string;
  ClientTier: string;
  Location: string;
  ProjectOwnerId: string;
  ProjectOwnerDivision: string;
  ScopingPersonId: string;
  EstimatedStartDate: string;
  EstimatedEndDate: string;
  ActualStartDate?: string;
  ActualEndDate?: string;
  Status: string;
  Divisions: string; // JSON string
  JobIds: string; // JSON string array
  ScopeReportIds: string; // JSON string array
}

interface SPTender extends SharePointListItem {
  Title: string; // Handover Number
  HandoverNumber: string;
  ClientName: string;
  ClientTier: string;
  ClientId: string;
  ProjectName: string;
  ProjectDescription: string;
  Location: string;
  EstimatedStartDate: string;
  EstimatedEndDate: string;
  DivisionsRequired: string; // JSON
  ProjectOwnerId: string;
  ScopingPersonId: string;
  Status: string;
  DateCreated: string;
  CreatedById: string;
}

interface SPScopeReport extends SharePointListItem {
  Title: string; // Report Number
  ReportNumber: string;
  ProjectId: string;
  VisitNumber: number;
  VisitType: string;
  ScheduledDate: string;
  ActualDate: string;
  CompletedById: string;
  SiteAccessibility: string; // JSON
  SurfaceCondition: string; // JSON
  Measurements: string; // JSON
  TrafficManagement: string; // JSON
  Utilities: string; // JSON
  Hazards: string; // JSON
  Recommendations: string;
  EstimatedDuration: number;
  Photos: string; // JSON array
  Signature: string;
  SignedAt: string;
  Status: string;
}

interface SPDivisionRequest extends SharePointListItem {
  Title: string; // Request Number
  RequestNumber: string;
  ProjectId: string;
  RequestedById: string;
  RequestedDivision: string;
  RequestedToId: string;
  WorkDescription: string;
  Location: string;
  RequestedDates: string; // JSON array
  Status: string;
  AssignedCrewId?: string;
  AssignedForemanId?: string;
  ResponseNotes?: string;
  ConfirmedDates?: string; // JSON array
  CompletedAt?: string;
  QaPackId?: string;
}

// ============================================================================
// CONVERSION HELPERS
// ============================================================================

/**
 * Convert our Job type to SharePoint format
 */
function jobToSP(job: Partial<Job>): Partial<SPJob> {
  return {
    Title: job.jobNo || '',
    JobNo: job.jobNo || '',
    Client: job.client || '',
    Division: job.division || '',
    ProjectName: job.projectName || '',
    Location: job.location || '',
    ForemanId: job.foremanId || '',
    JobDate: job.jobDate || '',
    DueDate: job.dueDate || '',
    Status: job.status || 'Pending',
    WorkDescription: job.workDescription || '',
    Area: job.area,
    Thickness: job.thickness,
    ClientTier: job.clientTier,
    QaSpec: job.qaSpec,
    ProjectId: job.projectId,
    AssignedCrewId: job.assignedCrewId,
    JobSheetData: job.jobSheetData ? JSON.stringify(job.jobSheetData) : undefined,
    AsphaltDetails: job.asphaltDetails ? JSON.stringify(job.asphaltDetails) : undefined,
    ProfilingDetails: job.profilingDetails ? JSON.stringify(job.profilingDetails) : undefined,
  };
}

/**
 * Convert SharePoint item to our Job type
 */
function spToJob(sp: SPJob): Job {
  return {
    id: String(sp.Id),
    jobNo: sp.JobNo || sp.Title,
    client: sp.Client,
    division: sp.Division as Job['division'],
    projectName: sp.ProjectName,
    location: sp.Location,
    foremanId: sp.ForemanId,
    jobDate: sp.JobDate,
    dueDate: sp.DueDate,
    status: sp.Status as Job['status'],
    workDescription: sp.WorkDescription,
    area: sp.Area,
    thickness: sp.Thickness,
    clientTier: sp.ClientTier as Job['clientTier'],
    qaSpec: sp.QaSpec,
    projectId: sp.ProjectId,
    assignedCrewId: sp.AssignedCrewId,
    jobSheetData: sp.JobSheetData ? JSON.parse(sp.JobSheetData) : undefined,
    asphaltDetails: sp.AsphaltDetails ? JSON.parse(sp.AsphaltDetails) : undefined,
    profilingDetails: sp.ProfilingDetails ? JSON.parse(sp.ProfilingDetails) : undefined,
  };
}

/**
 * Convert our Project type to SharePoint format
 */
function projectToSP(project: Partial<Project>): Partial<SPProject> {
  return {
    Title: project.projectNumber || '',
    ProjectNumber: project.projectNumber || '',
    HandoverId: project.handoverId || '',
    ProjectName: project.projectName || '',
    Client: project.client || '',
    ClientTier: project.clientTier || '',
    Location: project.location || '',
    ProjectOwnerId: project.projectOwnerId || '',
    ProjectOwnerDivision: project.projectOwnerDivision || '',
    ScopingPersonId: project.scopingPersonId || '',
    EstimatedStartDate: project.estimatedStartDate || '',
    EstimatedEndDate: project.estimatedEndDate || '',
    ActualStartDate: project.actualStartDate,
    ActualEndDate: project.actualEndDate,
    Status: project.status || 'Scoping',
    Divisions: project.divisions ? JSON.stringify(project.divisions) : '[]',
    JobIds: project.jobIds ? JSON.stringify(project.jobIds) : '[]',
    ScopeReportIds: project.scopeReportIds ? JSON.stringify(project.scopeReportIds) : '[]',
  };
}

/**
 * Convert SharePoint item to our Project type
 */
function spToProject(sp: SPProject): Project {
  return {
    id: String(sp.Id),
    projectNumber: sp.ProjectNumber || sp.Title,
    handoverId: sp.HandoverId,
    projectName: sp.ProjectName,
    client: sp.Client,
    clientTier: sp.ClientTier as Project['clientTier'],
    location: sp.Location,
    projectOwnerId: sp.ProjectOwnerId,
    projectOwnerDivision: sp.ProjectOwnerDivision as Project['projectOwnerDivision'],
    scopingPersonId: sp.ScopingPersonId,
    estimatedStartDate: sp.EstimatedStartDate,
    estimatedEndDate: sp.EstimatedEndDate,
    actualStartDate: sp.ActualStartDate,
    actualEndDate: sp.ActualEndDate,
    status: sp.Status as Project['status'],
    divisions: sp.Divisions ? JSON.parse(sp.Divisions) : [],
    jobIds: sp.JobIds ? JSON.parse(sp.JobIds) : [],
    scopeReportIds: sp.ScopeReportIds ? JSON.parse(sp.ScopeReportIds) : [],
  };
}

/**
 * Convert our TenderHandover type to SharePoint format
 */
function tenderToSP(tender: Partial<TenderHandover>): Partial<SPTender> {
  return {
    Title: tender.handoverNumber || '',
    HandoverNumber: tender.handoverNumber || '',
    ClientName: tender.clientName || '',
    ClientTier: tender.clientTier || '',
    ClientId: tender.clientId || '',
    ProjectName: tender.projectName || '',
    ProjectDescription: tender.projectDescription || '',
    Location: tender.location || '',
    EstimatedStartDate: tender.estimatedStartDate || '',
    EstimatedEndDate: tender.estimatedEndDate || '',
    DivisionsRequired: tender.divisionsRequired ? JSON.stringify(tender.divisionsRequired) : '{}',
    ProjectOwnerId: tender.projectOwnerId || '',
    ScopingPersonId: tender.scopingPersonId || '',
    Status: tender.status || 'Draft',
    DateCreated: tender.dateCreated || new Date().toISOString(),
    CreatedById: tender.createdBy || '',
  };
}

/**
 * Convert SharePoint item to our TenderHandover type
 */
function spToTender(sp: SPTender): TenderHandover {
  return {
    id: String(sp.Id),
    handoverNumber: sp.HandoverNumber || sp.Title,
    clientName: sp.ClientName,
    clientTier: sp.ClientTier as TenderHandover['clientTier'],
    clientId: sp.ClientId,
    projectName: sp.ProjectName,
    projectDescription: sp.ProjectDescription,
    location: sp.Location,
    estimatedStartDate: sp.EstimatedStartDate,
    estimatedEndDate: sp.EstimatedEndDate,
    divisionsRequired: sp.DivisionsRequired ? JSON.parse(sp.DivisionsRequired) : { asphalt: false, profiling: false, spray: false },
    projectOwnerId: sp.ProjectOwnerId,
    scopingPersonId: sp.ScopingPersonId,
    status: sp.Status as TenderHandover['status'],
    dateCreated: sp.DateCreated,
    createdBy: sp.CreatedById,
  };
}

// ============================================================================
// JOBS DATA OPERATIONS
// ============================================================================

export const JobsData = {
  async getAll(filters?: {
    status?: string;
    division?: string;
    foremanId?: string;
    projectId?: string;
  }): Promise<Job[]> {
    const filterParts: string[] = [];

    if (filters?.status) {
      filterParts.push(`Status eq '${filters.status}'`);
    }
    if (filters?.division) {
      filterParts.push(`Division eq '${filters.division}'`);
    }
    if (filters?.foremanId) {
      filterParts.push(`ForemanId eq '${filters.foremanId}'`);
    }
    if (filters?.projectId) {
      filterParts.push(`ProjectId eq '${filters.projectId}'`);
    }

    const options: SharePointQueryOptions = {
      filter: filterParts.length > 0 ? filterParts.join(' and ') : undefined,
      orderBy: 'JobDate',
      orderByDescending: true,
    };

    const items = await services.jobs.getItems<SPJob>(options);
    return items.map(spToJob);
  },

  async getById(id: string): Promise<Job | null> {
    try {
      const item = await services.jobs.getItem<SPJob>(parseInt(id, 10));
      return spToJob(item);
    } catch {
      return null;
    }
  },

  async getByJobNo(jobNo: string): Promise<Job | null> {
    const items = await services.jobs.getItems<SPJob>({
      filter: `JobNo eq '${jobNo}'`,
      top: 1,
    });
    return items.length > 0 ? spToJob(items[0]) : null;
  },

  async create(job: Omit<Job, 'id'>): Promise<Job> {
    const spData = jobToSP(job);
    const created = await services.jobs.createItem<SPJob>(spData as any);
    return spToJob(created);
  },

  async update(id: string, updates: Partial<Job>): Promise<Job | null> {
    const spData = jobToSP(updates);
    await services.jobs.updateItem<SPJob>(parseInt(id, 10), spData as any);
    return this.getById(id);
  },

  async delete(id: string): Promise<boolean> {
    try {
      await services.jobs.deleteItem(parseInt(id, 10));
      return true;
    } catch {
      return false;
    }
  },

  async getByForeman(foremanId: string): Promise<Job[]> {
    return this.getAll({ foremanId });
  },
};

// ============================================================================
// PROJECTS DATA OPERATIONS
// ============================================================================

export const ProjectsData = {
  async getAll(filters?: {
    status?: string;
    division?: string;
    projectOwnerId?: string;
    clientTier?: string;
  }): Promise<Project[]> {
    const filterParts: string[] = [];

    if (filters?.status) {
      filterParts.push(`Status eq '${filters.status}'`);
    }
    if (filters?.projectOwnerId) {
      filterParts.push(`ProjectOwnerId eq '${filters.projectOwnerId}'`);
    }
    if (filters?.clientTier) {
      filterParts.push(`ClientTier eq '${filters.clientTier}'`);
    }

    const options: SharePointQueryOptions = {
      filter: filterParts.length > 0 ? filterParts.join(' and ') : undefined,
      orderBy: 'Created',
      orderByDescending: true,
    };

    const items = await services.projects.getItems<SPProject>(options);
    let projects = items.map(spToProject);

    // Division filter requires post-processing (stored as JSON)
    if (filters?.division) {
      projects = projects.filter(p =>
        p.divisions?.some(d => d.division === filters.division)
      );
    }

    return projects;
  },

  async getById(id: string): Promise<Project | null> {
    try {
      const item = await services.projects.getItem<SPProject>(parseInt(id, 10));
      return spToProject(item);
    } catch {
      return null;
    }
  },

  async getByProjectNumber(projectNumber: string): Promise<Project | null> {
    const items = await services.projects.getItems<SPProject>({
      filter: `ProjectNumber eq '${projectNumber}'`,
      top: 1,
    });
    return items.length > 0 ? spToProject(items[0]) : null;
  },

  async create(project: Omit<Project, 'id'>): Promise<Project> {
    const spData = projectToSP(project);
    const created = await services.projects.createItem<SPProject>(spData as any);
    return spToProject(created);
  },

  async update(id: string, updates: Partial<Project>): Promise<Project | null> {
    const spData = projectToSP(updates);
    await services.projects.updateItem<SPProject>(parseInt(id, 10), spData as any);
    return this.getById(id);
  },

  async delete(id: string): Promise<boolean> {
    try {
      await services.projects.deleteItem(parseInt(id, 10));
      return true;
    } catch {
      return false;
    }
  },

  async updateStatus(id: string, status: Project['status']): Promise<Project | null> {
    return this.update(id, { status });
  },
};

// ============================================================================
// TENDERS DATA OPERATIONS
// ============================================================================

export const TendersData = {
  async getAll(filters?: {
    status?: string;
    clientTier?: string;
  }): Promise<TenderHandover[]> {
    const filterParts: string[] = [];

    if (filters?.status) {
      filterParts.push(`Status eq '${filters.status}'`);
    }
    if (filters?.clientTier) {
      filterParts.push(`ClientTier eq '${filters.clientTier}'`);
    }

    const options: SharePointQueryOptions = {
      filter: filterParts.length > 0 ? filterParts.join(' and ') : undefined,
      orderBy: 'DateCreated',
      orderByDescending: true,
    };

    const items = await services.tenders.getItems<SPTender>(options);
    return items.map(spToTender);
  },

  async getById(id: string): Promise<TenderHandover | null> {
    try {
      const item = await services.tenders.getItem<SPTender>(parseInt(id, 10));
      return spToTender(item);
    } catch {
      return null;
    }
  },

  async create(tender: Omit<TenderHandover, 'id'>): Promise<TenderHandover> {
    const spData = tenderToSP(tender);
    const created = await services.tenders.createItem<SPTender>(spData as any);
    return spToTender(created);
  },

  async update(id: string, updates: Partial<TenderHandover>): Promise<TenderHandover | null> {
    const spData = tenderToSP(updates);
    await services.tenders.updateItem<SPTender>(parseInt(id, 10), spData as any);
    return this.getById(id);
  },

  async delete(id: string): Promise<boolean> {
    try {
      await services.tenders.deleteItem(parseInt(id, 10));
      return true;
    } catch {
      return false;
    }
  },
};

// ============================================================================
// SCOPE REPORTS DATA OPERATIONS
// ============================================================================

export const ScopeReportsData = {
  async getAll(projectId?: string): Promise<ScopeReport[]> {
    const options: SharePointQueryOptions = {
      filter: projectId ? `ProjectId eq '${projectId}'` : undefined,
      orderBy: 'VisitNumber',
    };

    const items = await services.scopeReports.getItems<SPScopeReport>(options);
    return items.map(sp => ({
      id: String(sp.Id),
      reportNumber: sp.ReportNumber || sp.Title,
      projectId: sp.ProjectId,
      visitNumber: sp.VisitNumber,
      visitType: sp.VisitType as ScopeReport['visitType'],
      scheduledDate: sp.ScheduledDate,
      actualDate: sp.ActualDate,
      completedBy: sp.CompletedById,
      siteAccessibility: sp.SiteAccessibility ? JSON.parse(sp.SiteAccessibility) : {},
      surfaceCondition: sp.SurfaceCondition ? JSON.parse(sp.SurfaceCondition) : {},
      measurements: sp.Measurements ? JSON.parse(sp.Measurements) : {},
      trafficManagement: sp.TrafficManagement ? JSON.parse(sp.TrafficManagement) : {},
      utilities: sp.Utilities ? JSON.parse(sp.Utilities) : {},
      hazards: sp.Hazards ? JSON.parse(sp.Hazards) : {},
      recommendations: sp.Recommendations,
      estimatedDuration: sp.EstimatedDuration,
      photos: sp.Photos ? JSON.parse(sp.Photos) : [],
      signature: sp.Signature,
      signedAt: sp.SignedAt,
      status: sp.Status as ScopeReport['status'],
    }));
  },

  async getById(id: string): Promise<ScopeReport | null> {
    try {
      const sp = await services.scopeReports.getItem<SPScopeReport>(parseInt(id, 10));
      return {
        id: String(sp.Id),
        reportNumber: sp.ReportNumber || sp.Title,
        projectId: sp.ProjectId,
        visitNumber: sp.VisitNumber,
        visitType: sp.VisitType as ScopeReport['visitType'],
        scheduledDate: sp.ScheduledDate,
        actualDate: sp.ActualDate,
        completedBy: sp.CompletedById,
        siteAccessibility: sp.SiteAccessibility ? JSON.parse(sp.SiteAccessibility) : {},
        surfaceCondition: sp.SurfaceCondition ? JSON.parse(sp.SurfaceCondition) : {},
        measurements: sp.Measurements ? JSON.parse(sp.Measurements) : {},
        trafficManagement: sp.TrafficManagement ? JSON.parse(sp.TrafficManagement) : {},
        utilities: sp.Utilities ? JSON.parse(sp.Utilities) : {},
        hazards: sp.Hazards ? JSON.parse(sp.Hazards) : {},
        recommendations: sp.Recommendations,
        estimatedDuration: sp.EstimatedDuration,
        photos: sp.Photos ? JSON.parse(sp.Photos) : [],
        signature: sp.Signature,
        signedAt: sp.SignedAt,
        status: sp.Status as ScopeReport['status'],
      };
    } catch {
      return null;
    }
  },

  async create(report: Omit<ScopeReport, 'id'>): Promise<ScopeReport> {
    const spData = {
      Title: report.reportNumber,
      ReportNumber: report.reportNumber,
      ProjectId: report.projectId,
      VisitNumber: report.visitNumber,
      VisitType: report.visitType,
      ScheduledDate: report.scheduledDate,
      ActualDate: report.actualDate,
      CompletedById: report.completedBy,
      SiteAccessibility: JSON.stringify(report.siteAccessibility),
      SurfaceCondition: JSON.stringify(report.surfaceCondition),
      Measurements: JSON.stringify(report.measurements),
      TrafficManagement: JSON.stringify(report.trafficManagement),
      Utilities: JSON.stringify(report.utilities),
      Hazards: JSON.stringify(report.hazards),
      Recommendations: report.recommendations,
      EstimatedDuration: report.estimatedDuration,
      Photos: JSON.stringify(report.photos || []),
      Signature: report.signature,
      SignedAt: report.signedAt,
      Status: report.status || 'Draft',
    };

    const created = await services.scopeReports.createItem<SPScopeReport>(spData as any);
    return { ...report, id: String(created.Id) };
  },
};

// ============================================================================
// DIVISION REQUESTS DATA OPERATIONS
// ============================================================================

export const DivisionRequestsData = {
  async getAll(filters?: {
    projectId?: string;
    requestedDivision?: string;
    requestedById?: string;
    status?: string;
  }): Promise<DivisionRequest[]> {
    const filterParts: string[] = [];

    if (filters?.projectId) {
      filterParts.push(`ProjectId eq '${filters.projectId}'`);
    }
    if (filters?.requestedDivision) {
      filterParts.push(`RequestedDivision eq '${filters.requestedDivision}'`);
    }
    if (filters?.requestedById) {
      filterParts.push(`RequestedById eq '${filters.requestedById}'`);
    }
    if (filters?.status) {
      filterParts.push(`Status eq '${filters.status}'`);
    }

    const options: SharePointQueryOptions = {
      filter: filterParts.length > 0 ? filterParts.join(' and ') : undefined,
      orderBy: 'Created',
      orderByDescending: true,
    };

    const items = await services.divisionRequests.getItems<SPDivisionRequest>(options);
    return items.map(sp => ({
      id: String(sp.Id),
      requestNumber: sp.RequestNumber || sp.Title,
      projectId: sp.ProjectId,
      requestedBy: sp.RequestedById,
      requestedDivision: sp.RequestedDivision as DivisionRequest['requestedDivision'],
      requestedTo: sp.RequestedToId,
      workDescription: sp.WorkDescription,
      location: sp.Location,
      requestedDates: sp.RequestedDates ? JSON.parse(sp.RequestedDates) : [],
      status: sp.Status as DivisionRequest['status'],
      assignedCrewId: sp.AssignedCrewId,
      assignedForemanId: sp.AssignedForemanId,
      responseNotes: sp.ResponseNotes,
      confirmedDates: sp.ConfirmedDates ? JSON.parse(sp.ConfirmedDates) : undefined,
      completedAt: sp.CompletedAt,
      qaPackId: sp.QaPackId,
    }));
  },

  async getById(id: string): Promise<DivisionRequest | null> {
    try {
      const sp = await services.divisionRequests.getItem<SPDivisionRequest>(parseInt(id, 10));
      return {
        id: String(sp.Id),
        requestNumber: sp.RequestNumber || sp.Title,
        projectId: sp.ProjectId,
        requestedBy: sp.RequestedById,
        requestedDivision: sp.RequestedDivision as DivisionRequest['requestedDivision'],
        requestedTo: sp.RequestedToId,
        workDescription: sp.WorkDescription,
        location: sp.Location,
        requestedDates: sp.RequestedDates ? JSON.parse(sp.RequestedDates) : [],
        status: sp.Status as DivisionRequest['status'],
        assignedCrewId: sp.AssignedCrewId,
        assignedForemanId: sp.AssignedForemanId,
        responseNotes: sp.ResponseNotes,
        confirmedDates: sp.ConfirmedDates ? JSON.parse(sp.ConfirmedDates) : undefined,
        completedAt: sp.CompletedAt,
        qaPackId: sp.QaPackId,
      };
    } catch {
      return null;
    }
  },

  async create(request: Omit<DivisionRequest, 'id'>): Promise<DivisionRequest> {
    const spData = {
      Title: request.requestNumber,
      RequestNumber: request.requestNumber,
      ProjectId: request.projectId,
      RequestedById: request.requestedBy,
      RequestedDivision: request.requestedDivision,
      RequestedToId: request.requestedTo,
      WorkDescription: request.workDescription,
      Location: request.location,
      RequestedDates: JSON.stringify(request.requestedDates),
      Status: request.status || 'Pending',
    };

    const created = await services.divisionRequests.createItem<SPDivisionRequest>(spData as any);
    return { ...request, id: String(created.Id) };
  },

  async update(id: string, updates: Partial<DivisionRequest>): Promise<DivisionRequest | null> {
    const spData: any = {};

    if (updates.status) spData.Status = updates.status;
    if (updates.assignedCrewId) spData.AssignedCrewId = updates.assignedCrewId;
    if (updates.assignedForemanId) spData.AssignedForemanId = updates.assignedForemanId;
    if (updates.responseNotes) spData.ResponseNotes = updates.responseNotes;
    if (updates.confirmedDates) spData.ConfirmedDates = JSON.stringify(updates.confirmedDates);
    if (updates.completedAt) spData.CompletedAt = updates.completedAt;
    if (updates.qaPackId) spData.QaPackId = updates.qaPackId;

    await services.divisionRequests.updateItem<SPDivisionRequest>(parseInt(id, 10), spData);
    return this.getById(id);
  },
};

// ============================================================================
// GENERIC OPERATIONS FOR OTHER ENTITIES
// ============================================================================

/**
 * Generic list operations for simpler entities
 */
export function createDataService<T extends { id?: string }>(listName: string) {
  const service = createListService(listName);

  return {
    async getAll(filter?: string): Promise<T[]> {
      const items = await service.getItems<SharePointListItem & Record<string, any>>({
        filter,
        orderBy: 'Created',
        orderByDescending: true,
      });

      return items.map(item => {
        const result: any = { id: String(item.Id) };
        for (const [key, value] of Object.entries(item)) {
          if (key === 'Id' || key.startsWith('_') || key.startsWith('@')) continue;
          // Try to parse JSON strings
          if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
            try {
              result[key.charAt(0).toLowerCase() + key.slice(1)] = JSON.parse(value);
            } catch {
              result[key.charAt(0).toLowerCase() + key.slice(1)] = value;
            }
          } else {
            result[key.charAt(0).toLowerCase() + key.slice(1)] = value;
          }
        }
        return result as T;
      });
    },

    async getById(id: string): Promise<T | null> {
      try {
        const item = await service.getItem<SharePointListItem & Record<string, any>>(parseInt(id, 10));
        const result: any = { id: String(item.Id) };
        for (const [key, value] of Object.entries(item)) {
          if (key === 'Id' || key.startsWith('_') || key.startsWith('@')) continue;
          if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
            try {
              result[key.charAt(0).toLowerCase() + key.slice(1)] = JSON.parse(value);
            } catch {
              result[key.charAt(0).toLowerCase() + key.slice(1)] = value;
            }
          } else {
            result[key.charAt(0).toLowerCase() + key.slice(1)] = value;
          }
        }
        return result as T;
      } catch {
        return null;
      }
    },

    async create(data: Omit<T, 'id'>): Promise<T> {
      const spData: any = {};
      for (const [key, value] of Object.entries(data as any)) {
        // Skip 'id' field - SharePoint auto-generates Id
        if (key === 'id') continue;
        const spKey = key.charAt(0).toUpperCase() + key.slice(1);
        spData[spKey] = typeof value === 'object' ? JSON.stringify(value) : value;
      }
      // Set Title if not provided
      if (!spData.Title) {
        spData.Title = `Item-${Date.now()}`;
      }

      const created = await service.createItem<SharePointListItem>(spData);
      return { ...data, id: String(created.Id) } as T;
    },

    async update(id: string, updates: Partial<T>): Promise<T | null> {
      const spData: any = {};
      for (const [key, value] of Object.entries(updates as any)) {
        if (key === 'id') continue;
        const spKey = key.charAt(0).toUpperCase() + key.slice(1);
        spData[spKey] = typeof value === 'object' ? JSON.stringify(value) : value;
      }

      await service.updateItem(parseInt(id, 10), spData);
      return this.getById(id);
    },

    async delete(id: string): Promise<boolean> {
      try {
        await service.deleteItem(parseInt(id, 10));
        return true;
      } catch {
        return false;
      }
    },
  };
}

// ============================================================================
// QA PACKS DATA OPERATIONS (Custom implementation for complex structure)
// ============================================================================

export const QAPacksData = {
  async getAll(filter?: string): Promise<any[]> {
    const service = createListService('QAPacks');
    const items = await service.getItems<SharePointListItem & Record<string, any>>({
      filter,
      orderBy: 'Created',
      orderByDescending: true,
    });

    return items.map(item => {
      const result: any = { id: String(item.Id) };
      for (const [key, value] of Object.entries(item)) {
        if (key === 'Id' || key.startsWith('_') || key.startsWith('@')) continue;
        // Try to parse JSON strings
        if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
          try {
            result[key.charAt(0).toLowerCase() + key.slice(1)] = JSON.parse(value);
          } catch {
            result[key.charAt(0).toLowerCase() + key.slice(1)] = value;
          }
        } else {
          result[key.charAt(0).toLowerCase() + key.slice(1)] = value;
        }
      }
      return result;
    });
  },

  async getById(id: string): Promise<any | null> {
    try {
      const service = createListService('QAPacks');
      const item = await service.getItem<SharePointListItem & Record<string, any>>(parseInt(id, 10));
      const result: any = { id: String(item.Id) };
      for (const [key, value] of Object.entries(item)) {
        if (key === 'Id' || key.startsWith('_') || key.startsWith('@')) continue;
        if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
          try {
            result[key.charAt(0).toLowerCase() + key.slice(1)] = JSON.parse(value);
          } catch {
            result[key.charAt(0).toLowerCase() + key.slice(1)] = value;
          }
        } else {
          result[key.charAt(0).toLowerCase() + key.slice(1)] = value;
        }
      }
      return result;
    } catch {
      return null;
    }
  },

  async create(data: any): Promise<any> {
    const service = createListService('QAPacks');
    const spData: any = {};

    // Store jobNo at the top level for filtering
    if (data.job?.jobNo) {
      spData.JobNo = data.job.jobNo;
    }

    for (const [key, value] of Object.entries(data as any)) {
      const spKey = key.charAt(0).toUpperCase() + key.slice(1);
      spData[spKey] = typeof value === 'object' ? JSON.stringify(value) : value;
    }

    // Set Title to jobNo for easy identification
    if (!spData.Title && data.job?.jobNo) {
      spData.Title = `QAPack-${data.job.jobNo}-v${data.version || 1}`;
    }

    const created = await service.createItem<SharePointListItem>(spData);
    return { ...data, id: String(created.Id) };
  },

  async update(id: string, updates: any): Promise<any | null> {
    const service = createListService('QAPacks');
    const spData: any = {};
    for (const [key, value] of Object.entries(updates as any)) {
      if (key === 'id') continue;
      const spKey = key.charAt(0).toUpperCase() + key.slice(1);
      spData[spKey] = typeof value === 'object' ? JSON.stringify(value) : value;
    }

    await service.updateItem(parseInt(id, 10), spData);
    return this.getById(id);
  },

  async delete(id: string): Promise<boolean> {
    try {
      const service = createListService('QAPacks');
      await service.deleteItem(parseInt(id, 10));
      return true;
    } catch {
      return false;
    }
  },
};

// Create data services for remaining entities
export const IncidentsData = createDataService<IncidentReport>('Incidents');
export const NCRsData = createDataService<NonConformanceReport>('NCRs');
export const ResourcesData = createDataService('Resources');
export const ITPTemplatesData = createDataService('ITPTemplates');
export const SamplingPlansData = createDataService('SamplingPlans');
export const DraftsData = createDataService('Drafts');
export const NotificationsData = createDataService('Notifications');
export const DailyReportsData = createDataService('DailyReports');

// ============================================================================
// FOREMEN DATA - Uses CrewMembers list with backward-compatible field mapping
// ============================================================================
export const ForemenData = {
  async getAll(filter?: string): Promise<Foreman[]> {
    const service = createListService('CrewMembers');
    const items = await service.getItems<SharePointListItem & Record<string, any>>({
      filter: filter || "IsActive eq true",
      orderBy: 'FullName',
    });

    return items.map(item => ({
      id: String(item.Id),
      name: item.FullName || item.Title,
      username: item.Email || '',
      role: item.SystemRole || item.Role || '',
      division: item.Division,
      isForeman: item.IsForeman ?? false,
      phone: item.Phone,
      email: item.Email,
    })) as Foreman[];
  },

  async getById(id: string): Promise<Foreman | null> {
    try {
      const service = createListService('CrewMembers');
      const item = await service.getItem<SharePointListItem & Record<string, any>>(parseInt(id, 10));
      return {
        id: String(item.Id),
        name: item.FullName || item.Title,
        username: item.Email || '',
        role: item.SystemRole || item.Role || '',
        division: item.Division,
        isForeman: item.IsForeman ?? false,
        phone: item.Phone,
        email: item.Email,
      } as Foreman;
    } catch {
      return null;
    }
  },

  async create(data: Omit<Foreman, 'id'>): Promise<Foreman> {
    const service = createListService('CrewMembers');
    const spData = {
      Title: data.name,
      EmployeeId: `EMP-${Date.now()}`,
      FullName: data.name,
      Email: data.username,
      SystemRole: data.role,
      Role: data.role?.includes('foreman') ? 'Foreman' : 'Operator',
      Division: (data as any).division || 'Common',
      IsForeman: data.role?.includes('foreman') || false,
      IsActive: true,
      Phone: (data as any).phone || '',
    };

    const created = await service.createItem<SharePointListItem>(spData);
    return { ...data, id: String(created.Id) };
  },

  async update(id: string, updates: Partial<Foreman>): Promise<Foreman | null> {
    const service = createListService('CrewMembers');
    const spData: any = {};

    if (updates.name) {
      spData.FullName = updates.name;
      spData.Title = updates.name;
    }
    if (updates.username) spData.Email = updates.username;
    if (updates.role) {
      spData.SystemRole = updates.role;
      spData.IsForeman = updates.role.includes('foreman');
    }
    if ((updates as any).division) spData.Division = (updates as any).division;
    if ((updates as any).phone) spData.Phone = (updates as any).phone;

    await service.updateItem(parseInt(id, 10), spData);
    return this.getById(id);
  },

  async delete(id: string): Promise<boolean> {
    try {
      // Soft delete - set IsActive to false
      const service = createListService('CrewMembers');
      await service.updateItem(parseInt(id, 10), { IsActive: false });
      return true;
    } catch {
      return false;
    }
  },
};

// Documents service (for specifications and other documents)
interface SpecificationDocument {
  id?: string;
  title: string;
  category: 'Specification' | 'Procedure' | 'Form' | 'Other';
  fileKey: string;
  fileUrl: string;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
}
export const DocumentsData = createDataService<SpecificationDocument>('Documents');

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  Jobs: JobsData,
  Projects: ProjectsData,
  Tenders: TendersData,
  ScopeReports: ScopeReportsData,
  DivisionRequests: DivisionRequestsData,
  QAPacks: QAPacksData,
  Incidents: IncidentsData,
  NCRs: NCRsData,
  Foremen: ForemenData,
  Resources: ResourcesData,
  ITPTemplates: ITPTemplatesData,
  SamplingPlans: SamplingPlansData,
  Drafts: DraftsData,
  Notifications: NotificationsData,
  DailyReports: DailyReportsData,
  Documents: DocumentsData,
};
