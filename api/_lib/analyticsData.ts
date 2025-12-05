/**
 * Analytics Data Service
 *
 * Provides access to pre-calculated analytics and metrics for dashboards.
 */

import { getSharePointSiteId, getAccessToken, graphRequest } from './sharepointData.js';

const JOB_ANALYTICS_LIST = 'JobAnalytics';
const DAILY_METRICS_LIST = 'DailyMetrics';
const CREW_ANALYTICS_LIST = 'CrewAnalytics';

export interface JobAnalyticsRecord {
  id: string;
  jobId: string;
  jobNumber?: string;
  projectId?: string;
  division?: string;
  client?: string;
  clientTier?: string;
  foremanId?: string;
  scheduledDate?: string;
  actualStartDate?: string;
  actualCompletionDate?: string;
  plannedDurationHours?: number;
  actualDurationHours?: number;
  durationVariance?: number;
  plannedArea?: number;
  actualArea?: number;
  plannedTonnes?: number;
  actualTonnes?: number;
  qaScore?: number;
  incidentCount?: number;
  ncrCount?: number;
  crewCount?: number;
  equipmentCount?: number;
  weatherConditions?: string;
  onTimeCompletion?: boolean;
  qaPackId?: string;
  calculatedAt?: string;
}

export interface DailyMetricsRecord {
  id: string;
  metricDate: string;
  division: string;
  jobsScheduled?: number;
  jobsCompleted?: number;
  jobsInProgress?: number;
  jobsOnHold?: number;
  jobsCancelled?: number;
  totalAreaCompleted?: number;
  totalTonnesLaid?: number;
  qaPacksSubmitted?: number;
  qaPacksPending?: number;
  qaPacksApproved?: number;
  qaPassRate?: number;
  incidentsReported?: number;
  ncrsRaised?: number;
  crewsDeployed?: number;
  equipmentUtilization?: number;
  weatherImpactedJobs?: number;
  averageJobDuration?: number;
  onTimeCompletionRate?: number;
}

export interface CrewAnalyticsRecord {
  id: string;
  crewMemberId: string;
  crewMemberName?: string;
  metricMonth: string;
  division?: string;
  jobsAssigned?: number;
  jobsCompleted?: number;
  jobsOnTime?: number;
  totalHoursWorked?: number;
  utilizationRate?: number;
  averageQaScore?: number;
  safetyIncidents?: number;
  ncrsAssociated?: number;
  productivityScore?: number;
  certificationsActive?: number;
  certificationsExpired?: number;
}

// ============================================================================
// JOB ANALYTICS
// ============================================================================

/**
 * Get job analytics by date range
 */
export async function getJobAnalytics(
  startDate: string,
  endDate: string,
  division?: string
): Promise<JobAnalyticsRecord[]> {
  const siteId = await getSharePointSiteId();
  const token = await getAccessToken();

  let filter = `fields/ScheduledDate ge '${startDate}' and fields/ScheduledDate le '${endDate}'`;
  if (division) {
    filter += ` and fields/Division eq '${division}'`;
  }

  const response = await graphRequest(
    token,
    `/sites/${siteId}/lists/${JOB_ANALYTICS_LIST}/items?$expand=fields&$filter=${filter}&$top=500`,
    'GET'
  );

  return (response.value || []).map(mapJobAnalytics);
}

/**
 * Get job analytics for a specific job
 */
export async function getJobAnalyticsById(jobId: string): Promise<JobAnalyticsRecord | null> {
  const siteId = await getSharePointSiteId();
  const token = await getAccessToken();

  const response = await graphRequest(
    token,
    `/sites/${siteId}/lists/${JOB_ANALYTICS_LIST}/items?$expand=fields&$filter=fields/JobId eq '${jobId}'`,
    'GET'
  );

  if (response.value && response.value.length > 0) {
    return mapJobAnalytics(response.value[0]);
  }
  return null;
}

/**
 * Create or update job analytics record
 */
export async function upsertJobAnalytics(data: Omit<JobAnalyticsRecord, 'id'>): Promise<JobAnalyticsRecord> {
  const siteId = await getSharePointSiteId();
  const token = await getAccessToken();

  // Check if exists
  const existing = await getJobAnalyticsById(data.jobId);

  const fields = {
    Title: data.jobId,
    JobId: data.jobId,
    JobNumber: data.jobNumber || '',
    ProjectId: data.projectId || '',
    Division: data.division || '',
    Client: data.client || '',
    ClientTier: data.clientTier || '',
    ForemanId: data.foremanId || '',
    ScheduledDate: data.scheduledDate || '',
    ActualStartDate: data.actualStartDate || '',
    ActualCompletionDate: data.actualCompletionDate || '',
    PlannedDurationHours: data.plannedDurationHours || 0,
    ActualDurationHours: data.actualDurationHours || 0,
    DurationVariance: data.durationVariance || 0,
    PlannedArea: data.plannedArea || 0,
    ActualArea: data.actualArea || 0,
    PlannedTonnes: data.plannedTonnes || 0,
    ActualTonnes: data.actualTonnes || 0,
    QAScore: data.qaScore || 0,
    IncidentCount: data.incidentCount || 0,
    NCRCount: data.ncrCount || 0,
    CrewCount: data.crewCount || 0,
    EquipmentCount: data.equipmentCount || 0,
    WeatherConditions: data.weatherConditions || '',
    OnTimeCompletion: data.onTimeCompletion || false,
    QAPackId: data.qaPackId || '',
    CalculatedAt: new Date().toISOString(),
  };

  if (existing) {
    await graphRequest(
      token,
      `/sites/${siteId}/lists/${JOB_ANALYTICS_LIST}/items/${existing.id}/fields`,
      'PATCH',
      fields
    );
    return { ...existing, ...data, calculatedAt: fields.CalculatedAt };
  } else {
    const response = await graphRequest(
      token,
      `/sites/${siteId}/lists/${JOB_ANALYTICS_LIST}/items`,
      'POST',
      { fields }
    );
    return mapJobAnalytics(response);
  }
}

function mapJobAnalytics(item: any): JobAnalyticsRecord {
  const f = item.fields;
  return {
    id: item.id,
    jobId: f.JobId || f.Title,
    jobNumber: f.JobNumber,
    projectId: f.ProjectId,
    division: f.Division,
    client: f.Client,
    clientTier: f.ClientTier,
    foremanId: f.ForemanId,
    scheduledDate: f.ScheduledDate,
    actualStartDate: f.ActualStartDate,
    actualCompletionDate: f.ActualCompletionDate,
    plannedDurationHours: f.PlannedDurationHours,
    actualDurationHours: f.ActualDurationHours,
    durationVariance: f.DurationVariance,
    plannedArea: f.PlannedArea,
    actualArea: f.ActualArea,
    plannedTonnes: f.PlannedTonnes,
    actualTonnes: f.ActualTonnes,
    qaScore: f.QAScore,
    incidentCount: f.IncidentCount,
    ncrCount: f.NCRCount,
    crewCount: f.CrewCount,
    equipmentCount: f.EquipmentCount,
    weatherConditions: f.WeatherConditions,
    onTimeCompletion: f.OnTimeCompletion,
    qaPackId: f.QAPackId,
    calculatedAt: f.CalculatedAt,
  };
}

// ============================================================================
// DAILY METRICS
// ============================================================================

/**
 * Get daily metrics for a date range
 */
export async function getDailyMetrics(
  startDate: string,
  endDate: string,
  division?: string
): Promise<DailyMetricsRecord[]> {
  const siteId = await getSharePointSiteId();
  const token = await getAccessToken();

  let filter = `fields/MetricDate ge '${startDate}' and fields/MetricDate le '${endDate}'`;
  if (division) {
    filter += ` and fields/Division eq '${division}'`;
  }

  const response = await graphRequest(
    token,
    `/sites/${siteId}/lists/${DAILY_METRICS_LIST}/items?$expand=fields&$filter=${filter}&$orderby=fields/MetricDate desc&$top=100`,
    'GET'
  );

  return (response.value || []).map(mapDailyMetrics);
}

/**
 * Get metrics for a specific date
 */
export async function getDailyMetricsForDate(date: string, division: string = 'All'): Promise<DailyMetricsRecord | null> {
  const siteId = await getSharePointSiteId();
  const token = await getAccessToken();

  const response = await graphRequest(
    token,
    `/sites/${siteId}/lists/${DAILY_METRICS_LIST}/items?$expand=fields&$filter=fields/MetricDate eq '${date}' and fields/Division eq '${division}'`,
    'GET'
  );

  if (response.value && response.value.length > 0) {
    return mapDailyMetrics(response.value[0]);
  }
  return null;
}

/**
 * Create or update daily metrics
 */
export async function upsertDailyMetrics(data: Omit<DailyMetricsRecord, 'id'>): Promise<DailyMetricsRecord> {
  const siteId = await getSharePointSiteId();
  const token = await getAccessToken();

  const existing = await getDailyMetricsForDate(data.metricDate, data.division);

  const fields = {
    Title: `${data.metricDate}-${data.division}`,
    MetricDate: data.metricDate,
    Division: data.division,
    JobsScheduled: data.jobsScheduled || 0,
    JobsCompleted: data.jobsCompleted || 0,
    JobsInProgress: data.jobsInProgress || 0,
    JobsOnHold: data.jobsOnHold || 0,
    JobsCancelled: data.jobsCancelled || 0,
    TotalAreaCompleted: data.totalAreaCompleted || 0,
    TotalTonnesLaid: data.totalTonnesLaid || 0,
    QAPacksSubmitted: data.qaPacksSubmitted || 0,
    QAPacksPending: data.qaPacksPending || 0,
    QAPacksApproved: data.qaPacksApproved || 0,
    QAPassRate: data.qaPassRate || 0,
    IncidentsReported: data.incidentsReported || 0,
    NCRsRaised: data.ncrsRaised || 0,
    CrewsDeployed: data.crewsDeployed || 0,
    EquipmentUtilization: data.equipmentUtilization || 0,
    WeatherImpactedJobs: data.weatherImpactedJobs || 0,
    AverageJobDuration: data.averageJobDuration || 0,
    OnTimeCompletionRate: data.onTimeCompletionRate || 0,
  };

  if (existing) {
    await graphRequest(
      token,
      `/sites/${siteId}/lists/${DAILY_METRICS_LIST}/items/${existing.id}/fields`,
      'PATCH',
      fields
    );
    return { ...existing, ...data };
  } else {
    const response = await graphRequest(
      token,
      `/sites/${siteId}/lists/${DAILY_METRICS_LIST}/items`,
      'POST',
      { fields }
    );
    return mapDailyMetrics(response);
  }
}

function mapDailyMetrics(item: any): DailyMetricsRecord {
  const f = item.fields;
  return {
    id: item.id,
    metricDate: f.MetricDate,
    division: f.Division,
    jobsScheduled: f.JobsScheduled,
    jobsCompleted: f.JobsCompleted,
    jobsInProgress: f.JobsInProgress,
    jobsOnHold: f.JobsOnHold,
    jobsCancelled: f.JobsCancelled,
    totalAreaCompleted: f.TotalAreaCompleted,
    totalTonnesLaid: f.TotalTonnesLaid,
    qaPacksSubmitted: f.QAPacksSubmitted,
    qaPacksPending: f.QAPacksPending,
    qaPacksApproved: f.QAPacksApproved,
    qaPassRate: f.QAPassRate,
    incidentsReported: f.IncidentsReported,
    ncrsRaised: f.NCRsRaised,
    crewsDeployed: f.CrewsDeployed,
    equipmentUtilization: f.EquipmentUtilization,
    weatherImpactedJobs: f.WeatherImpactedJobs,
    averageJobDuration: f.AverageJobDuration,
    onTimeCompletionRate: f.OnTimeCompletionRate,
  };
}

// ============================================================================
// CREW ANALYTICS
// ============================================================================

/**
 * Get crew analytics for a month
 */
export async function getCrewAnalytics(month: string, division?: string): Promise<CrewAnalyticsRecord[]> {
  const siteId = await getSharePointSiteId();
  const token = await getAccessToken();

  let filter = `fields/MetricMonth eq '${month}'`;
  if (division) {
    filter += ` and fields/Division eq '${division}'`;
  }

  const response = await graphRequest(
    token,
    `/sites/${siteId}/lists/${CREW_ANALYTICS_LIST}/items?$expand=fields&$filter=${filter}&$top=500`,
    'GET'
  );

  return (response.value || []).map(mapCrewAnalytics);
}

/**
 * Get analytics for a specific crew member
 */
export async function getCrewMemberAnalytics(crewMemberId: string, months = 6): Promise<CrewAnalyticsRecord[]> {
  const siteId = await getSharePointSiteId();
  const token = await getAccessToken();

  const response = await graphRequest(
    token,
    `/sites/${siteId}/lists/${CREW_ANALYTICS_LIST}/items?$expand=fields&$filter=fields/CrewMemberId eq '${crewMemberId}'&$orderby=fields/MetricMonth desc&$top=${months}`,
    'GET'
  );

  return (response.value || []).map(mapCrewAnalytics);
}

function mapCrewAnalytics(item: any): CrewAnalyticsRecord {
  const f = item.fields;
  return {
    id: item.id,
    crewMemberId: f.CrewMemberId,
    crewMemberName: f.CrewMemberName,
    metricMonth: f.MetricMonth,
    division: f.Division,
    jobsAssigned: f.JobsAssigned,
    jobsCompleted: f.JobsCompleted,
    jobsOnTime: f.JobsOnTime,
    totalHoursWorked: f.TotalHoursWorked,
    utilizationRate: f.UtilizationRate,
    averageQaScore: f.AverageQAScore,
    safetyIncidents: f.SafetyIncidents,
    ncrsAssociated: f.NCRsAssociated,
    productivityScore: f.ProductivityScore,
    certificationsActive: f.CertificationsActive,
    certificationsExpired: f.CertificationsExpired,
  };
}

// ============================================================================
// DASHBOARD SUMMARY
// ============================================================================

export interface DashboardSummary {
  today: {
    jobsScheduled: number;
    jobsCompleted: number;
    jobsInProgress: number;
    qaPacksPending: number;
  };
  week: {
    totalJobsCompleted: number;
    totalArea: number;
    onTimeRate: number;
    qaPassRate: number;
  };
  alerts: {
    overdueJobs: number;
    pendingQAPacks: number;
    expiringCertifications: number;
    openIncidents: number;
  };
}

/**
 * Get dashboard summary for management view
 */
export async function getDashboardSummary(division?: string): Promise<DashboardSummary> {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Get today's metrics
  const todayMetrics = await getDailyMetricsForDate(today, division || 'All');

  // Get week's metrics
  const weekMetrics = await getDailyMetrics(weekAgo, today, division);

  // Calculate week totals
  const weekTotals = weekMetrics.reduce(
    (acc, m) => ({
      completed: acc.completed + (m.jobsCompleted || 0),
      area: acc.area + (m.totalAreaCompleted || 0),
      onTime: acc.onTime + (m.onTimeCompletionRate || 0),
      qaPass: acc.qaPass + (m.qaPassRate || 0),
    }),
    { completed: 0, area: 0, onTime: 0, qaPass: 0 }
  );

  const avgCount = weekMetrics.length || 1;

  return {
    today: {
      jobsScheduled: todayMetrics?.jobsScheduled || 0,
      jobsCompleted: todayMetrics?.jobsCompleted || 0,
      jobsInProgress: todayMetrics?.jobsInProgress || 0,
      qaPacksPending: todayMetrics?.qaPacksPending || 0,
    },
    week: {
      totalJobsCompleted: weekTotals.completed,
      totalArea: weekTotals.area,
      onTimeRate: Math.round(weekTotals.onTime / avgCount),
      qaPassRate: Math.round(weekTotals.qaPass / avgCount),
    },
    alerts: {
      overdueJobs: 0, // TODO: Calculate from jobs list
      pendingQAPacks: todayMetrics?.qaPacksPending || 0,
      expiringCertifications: 0, // TODO: Calculate from certifications
      openIncidents: 0, // TODO: Calculate from incidents
    },
  };
}

export const AnalyticsData = {
  getJobAnalytics,
  getJobAnalyticsById,
  upsertJobAnalytics,
  getDailyMetrics,
  getDailyMetricsForDate,
  upsertDailyMetrics,
  getCrewAnalytics,
  getCrewMemberAnalytics,
  getDashboardSummary,
};
