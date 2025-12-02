/**
 * Cached Data Layer for SGA QA System
 *
 * Wraps SharePoint data operations with caching for improved performance.
 * Uses Vercel KV in production, in-memory cache in development.
 */

import { cacheOrFetch, cacheDelete, invalidateEntity, CacheKeys, CacheTTL } from './cache.js';
import {
  JobsData,
  ProjectsData,
  TendersData,
  ForemenData,
  ResourcesData,
  IncidentsData,
  NCRsData,
  QAPacksData,
  NotificationsData,
  DailyReportsData,
  ITPTemplatesData,
} from './sharepointData.js';

import type { Job, Project, TenderHandover, Foreman, IncidentReport, NonConformanceReport } from '../../src/types';

// ============================================================================
// CACHED JOBS OPERATIONS
// ============================================================================

export const CachedJobsData = {
  async getAll(filters?: {
    status?: string;
    division?: string;
    foremanId?: string;
    projectId?: string;
  }): Promise<Job[]> {
    // Build cache key based on filters
    let cacheKey = CacheKeys.JOBS_ALL;
    if (filters?.status) {
      cacheKey = CacheKeys.JOBS_BY_STATUS(filters.status);
    } else if (filters?.foremanId) {
      cacheKey = CacheKeys.JOBS_BY_FOREMAN(filters.foremanId);
    } else if (filters?.projectId) {
      cacheKey = CacheKeys.JOBS_BY_PROJECT(filters.projectId);
    }

    return cacheOrFetch(
      cacheKey,
      () => JobsData.getAll(filters),
      CacheTTL.JOBS_LIST
    );
  },

  async getById(id: string): Promise<Job | null> {
    return cacheOrFetch(
      CacheKeys.JOB(id),
      () => JobsData.getById(id),
      CacheTTL.JOBS
    );
  },

  async create(job: Omit<Job, 'id'>): Promise<Job> {
    const result = await JobsData.create(job);
    // Invalidate related caches
    await invalidateEntity('jobs');
    return result;
  },

  async update(id: string, updates: Partial<Job>): Promise<Job | null> {
    const result = await JobsData.update(id, updates);
    // Invalidate specific job and list caches
    await cacheDelete(CacheKeys.JOB(id));
    await invalidateEntity('jobs');
    return result;
  },

  async delete(id: string): Promise<boolean> {
    const result = await JobsData.delete(id);
    await invalidateEntity('jobs');
    return result;
  },
};

// ============================================================================
// CACHED PROJECTS OPERATIONS
// ============================================================================

export const CachedProjectsData = {
  async getAll(filters?: {
    status?: string;
    division?: string;
    projectOwnerId?: string;
    clientTier?: string;
  }): Promise<Project[]> {
    let cacheKey = CacheKeys.PROJECTS_ALL;
    if (filters?.status) {
      cacheKey = CacheKeys.PROJECTS_BY_STATUS(filters.status);
    }

    return cacheOrFetch(
      cacheKey,
      () => ProjectsData.getAll(filters),
      CacheTTL.PROJECTS
    );
  },

  async getById(id: string): Promise<Project | null> {
    return cacheOrFetch(
      CacheKeys.PROJECT(id),
      () => ProjectsData.getById(id),
      CacheTTL.PROJECTS
    );
  },

  async create(project: Omit<Project, 'id'>): Promise<Project> {
    const result = await ProjectsData.create(project);
    await invalidateEntity('projects');
    return result;
  },

  async update(id: string, updates: Partial<Project>): Promise<Project | null> {
    const result = await ProjectsData.update(id, updates);
    await cacheDelete(CacheKeys.PROJECT(id));
    await invalidateEntity('projects');
    return result;
  },

  async delete(id: string): Promise<boolean> {
    const result = await ProjectsData.delete(id);
    await invalidateEntity('projects');
    return result;
  },
};

// ============================================================================
// CACHED FOREMEN OPERATIONS
// ============================================================================

export const CachedForemenData = {
  async getAll(): Promise<Foreman[]> {
    return cacheOrFetch(
      CacheKeys.FOREMEN_ALL,
      () => ForemenData.getAll(),
      CacheTTL.FOREMEN
    );
  },

  async getById(id: string): Promise<Foreman | null> {
    return cacheOrFetch(
      CacheKeys.FOREMAN(id),
      () => ForemenData.getById(id),
      CacheTTL.FOREMEN
    );
  },
};

// ============================================================================
// CACHED RESOURCES OPERATIONS
// ============================================================================

export const CachedResourcesData = {
  async getAll(filter?: string): Promise<any[]> {
    return cacheOrFetch(
      CacheKeys.RESOURCES_ALL,
      () => ResourcesData.getAll(filter),
      CacheTTL.RESOURCES
    );
  },

  async create(data: any): Promise<any> {
    const result = await ResourcesData.create(data);
    await invalidateEntity('resources');
    return result;
  },

  async update(id: string, updates: any): Promise<any> {
    const result = await ResourcesData.update(id, updates);
    await invalidateEntity('resources');
    return result;
  },

  async delete(id: string): Promise<boolean> {
    const result = await ResourcesData.delete(id);
    await invalidateEntity('resources');
    return result;
  },
};

// ============================================================================
// CACHED TENDERS OPERATIONS
// ============================================================================

export const CachedTendersData = {
  async getAll(filters?: { status?: string; clientTier?: string }): Promise<TenderHandover[]> {
    return cacheOrFetch(
      CacheKeys.TENDERS_ALL,
      () => TendersData.getAll(filters),
      CacheTTL.TENDERS
    );
  },

  async create(tender: Omit<TenderHandover, 'id'>): Promise<TenderHandover> {
    const result = await TendersData.create(tender);
    await cacheDelete(CacheKeys.TENDERS_ALL);
    return result;
  },

  async update(id: string, updates: Partial<TenderHandover>): Promise<TenderHandover | null> {
    const result = await TendersData.update(id, updates);
    await cacheDelete(CacheKeys.TENDERS_ALL);
    return result;
  },
};

// ============================================================================
// CACHED ITP TEMPLATES OPERATIONS
// ============================================================================

export const CachedITPTemplatesData = {
  async getAll(filter?: string): Promise<any[]> {
    return cacheOrFetch(
      CacheKeys.ITP_TEMPLATES_ALL,
      () => ITPTemplatesData.getAll(filter),
      CacheTTL.ITP_TEMPLATES
    );
  },

  async getByDivision(division: string): Promise<any[]> {
    return cacheOrFetch(
      CacheKeys.ITP_TEMPLATES_BY_DIVISION(division),
      () => ITPTemplatesData.getAll(`Division eq '${division}'`),
      CacheTTL.ITP_TEMPLATES
    );
  },
};

// ============================================================================
// CACHED INCIDENTS OPERATIONS
// ============================================================================

export const CachedIncidentsData = {
  async getAll(filter?: string): Promise<IncidentReport[]> {
    return cacheOrFetch(
      CacheKeys.INCIDENTS_ALL,
      () => IncidentsData.getAll(filter),
      CacheTTL.INCIDENTS
    );
  },

  async create(incident: Omit<IncidentReport, 'id'>): Promise<IncidentReport> {
    const result = await IncidentsData.create(incident);
    await invalidateEntity('incidents');
    return result;
  },

  async update(id: string, updates: Partial<IncidentReport>): Promise<IncidentReport | null> {
    const result = await IncidentsData.update(id, updates);
    await invalidateEntity('incidents');
    return result;
  },
};

// ============================================================================
// CACHED NCRS OPERATIONS
// ============================================================================

export const CachedNCRsData = {
  async getAll(filter?: string): Promise<NonConformanceReport[]> {
    return cacheOrFetch(
      CacheKeys.NCRS_ALL,
      () => NCRsData.getAll(filter),
      CacheTTL.NCRS
    );
  },

  async create(ncr: Omit<NonConformanceReport, 'id'>): Promise<NonConformanceReport> {
    const result = await NCRsData.create(ncr);
    await invalidateEntity('ncrs');
    return result;
  },

  async update(id: string, updates: Partial<NonConformanceReport>): Promise<NonConformanceReport | null> {
    const result = await NCRsData.update(id, updates);
    await invalidateEntity('ncrs');
    return result;
  },
};

// ============================================================================
// CACHED QA PACKS OPERATIONS
// ============================================================================

export const CachedQAPacksData = {
  async getAll(filter?: string): Promise<any[]> {
    return cacheOrFetch(
      CacheKeys.QA_PACKS_ALL,
      () => QAPacksData.getAll(filter),
      CacheTTL.QA_PACKS
    );
  },

  async create(qaPack: any): Promise<any> {
    const result = await QAPacksData.create(qaPack);
    await invalidateEntity('qapacks');
    return result;
  },

  async update(id: string, updates: any): Promise<any> {
    const result = await QAPacksData.update(id, updates);
    await invalidateEntity('qapacks');
    return result;
  },
};

// ============================================================================
// CACHED NOTIFICATIONS OPERATIONS
// ============================================================================

export const CachedNotificationsData = {
  async getByUser(userId: string): Promise<any[]> {
    return cacheOrFetch(
      CacheKeys.NOTIFICATIONS_BY_USER(userId),
      () => NotificationsData.getAll(`UserId eq '${userId}'`),
      CacheTTL.NOTIFICATIONS
    );
  },

  async markAsRead(id: string): Promise<any> {
    const result = await NotificationsData.update(id, { isRead: true, readDate: new Date().toISOString() });
    // Invalidate all user notification caches
    await cacheDelete(CacheKeys.NOTIFICATIONS_BY_USER('*'));
    return result;
  },
};

// ============================================================================
// DASHBOARD STATISTICS (CACHED AGGREGATIONS)
// ============================================================================

export interface DashboardStats {
  totalJobs: number;
  jobsByStatus: Record<string, number>;
  jobsByDivision: Record<string, number>;
  totalProjects: number;
  projectsByStatus: Record<string, number>;
  totalIncidents: number;
  incidentsThisMonth: number;
  openNCRs: number;
  pendingQAPacks: number;
  lastUpdated: string;
}

export const CachedDashboardData = {
  async getStats(): Promise<DashboardStats> {
    return cacheOrFetch(
      CacheKeys.DASHBOARD_STATS,
      async () => {
        // Fetch all data in parallel
        const [jobs, projects, incidents, ncrs, qaPacks] = await Promise.all([
          JobsData.getAll(),
          ProjectsData.getAll(),
          IncidentsData.getAll(),
          NCRsData.getAll(),
          QAPacksData.getAll(),
        ]);

        // Calculate job statistics
        const jobsByStatus: Record<string, number> = {};
        const jobsByDivision: Record<string, number> = {};
        for (const job of jobs) {
          jobsByStatus[job.status] = (jobsByStatus[job.status] || 0) + 1;
          jobsByDivision[job.division] = (jobsByDivision[job.division] || 0) + 1;
        }

        // Calculate project statistics
        const projectsByStatus: Record<string, number> = {};
        for (const project of projects) {
          projectsByStatus[project.status] = (projectsByStatus[project.status] || 0) + 1;
        }

        // Calculate incidents this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const incidentsThisMonth = incidents.filter((i: any) =>
          new Date(i.dateOfIncident || i.createdDate) >= startOfMonth
        ).length;

        // Open NCRs
        const openNCRs = ncrs.filter((n: any) =>
          n.status !== 'Closed' && n.status !== 'Resolved'
        ).length;

        // Pending QA Packs
        const pendingQAPacks = qaPacks.filter((q: any) =>
          q.status === 'Draft' || q.status === 'Pending Review'
        ).length;

        return {
          totalJobs: jobs.length,
          jobsByStatus,
          jobsByDivision,
          totalProjects: projects.length,
          projectsByStatus,
          totalIncidents: incidents.length,
          incidentsThisMonth,
          openNCRs,
          pendingQAPacks,
          lastUpdated: new Date().toISOString(),
        };
      },
      CacheTTL.DASHBOARD_STATS
    );
  },

  async getJobsCompletionTrend(days: number = 30): Promise<{ date: string; completed: number }[]> {
    return cacheOrFetch(
      `${CacheKeys.DASHBOARD_COMPLETION_RATE}:${days}`,
      async () => {
        const jobs = await JobsData.getAll({ status: 'Completed' });
        const now = new Date();
        const trend: { date: string; completed: number }[] = [];

        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];

          const completed = jobs.filter((j: Job) => {
            const jobDate = j.jobDate?.split('T')[0];
            return jobDate === dateStr;
          }).length;

          trend.push({ date: dateStr, completed });
        }

        return trend;
      },
      CacheTTL.DASHBOARD_CHARTS
    );
  },

  async getIncidentsTrend(months: number = 6): Promise<{ month: string; count: number; type: Record<string, number> }[]> {
    return cacheOrFetch(
      `${CacheKeys.DASHBOARD_INCIDENTS_TREND}:${months}`,
      async () => {
        const incidents = await IncidentsData.getAll();
        const trend: { month: string; count: number; type: Record<string, number> }[] = [];

        const now = new Date();
        for (let i = months - 1; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthStr = date.toISOString().slice(0, 7); // YYYY-MM

          const monthIncidents = incidents.filter((inc: any) => {
            const incDate = inc.dateOfIncident || inc.createdDate;
            return incDate?.startsWith(monthStr);
          });

          const typeCount: Record<string, number> = {};
          for (const inc of monthIncidents) {
            const type = (inc as any).type || 'Other';
            typeCount[type] = (typeCount[type] || 0) + 1;
          }

          trend.push({
            month: date.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }),
            count: monthIncidents.length,
            type: typeCount,
          });
        }

        return trend;
      },
      CacheTTL.DASHBOARD_CHARTS
    );
  },
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  Jobs: CachedJobsData,
  Projects: CachedProjectsData,
  Foremen: CachedForemenData,
  Resources: CachedResourcesData,
  Tenders: CachedTendersData,
  ITPTemplates: CachedITPTemplatesData,
  Incidents: CachedIncidentsData,
  NCRs: CachedNCRsData,
  QAPacks: CachedQAPacksData,
  Notifications: CachedNotificationsData,
  Dashboard: CachedDashboardData,
};
