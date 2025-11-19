// services/dashboardApi.ts

import { Job, FinalQaPack, IncidentReport } from '../types';

/**
 * Dashboard statistics interface
 */
export interface DashboardStats {
  activeJobs: number;
  pendingReports: number;
  openIncidents: number;
}

/**
 * Daily briefing response interface
 */
export interface DailyBriefing {
  summary: string;
}

/**
 * Recent activity item interface
 */
export interface RecentActivityItem {
  id: string;
  type: 'job' | 'report' | 'incident';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

/**
 * Get dashboard statistics for a foreman
 */
export const getDashboardStats = async (foremanId: string): Promise<DashboardStats> => {
  try {
    // Fetch all data in parallel for better performance
    const [jobsResponse, reportsResponse, incidentsResponse] = await Promise.all([
      fetch(`/api/get-foreman-jobs?foremanId=${foremanId}`),
      fetch(`/api/get-reports?foremanId=${foremanId}`),
      fetch(`/api/get-incidents?reporterId=${foremanId}`)
    ]);

    if (!jobsResponse.ok || !reportsResponse.ok || !incidentsResponse.ok) {
      throw new Error('Failed to fetch dashboard data');
    }

    const [jobs, reports, incidents]: [Job[], FinalQaPack[], IncidentReport[]] = await Promise.all([
      jobsResponse.json(),
      reportsResponse.json(),
      incidentsResponse.json()
    ]);

    // Calculate active jobs (jobs within the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeJobs = jobs.filter(job =>
      new Date(job.jobDate) >= thirtyDaysAgo
    ).length;

    // Count pending reports (reports with 'Pending Review' status)
    const pendingReports = reports.filter(report =>
      report.status === 'Pending Review' || !report.status
    ).length;

    // Count open incidents
    const openIncidents = incidents.filter(incident =>
      incident.status === 'Open' || incident.status === 'Under Investigation'
    ).length;

    return {
      activeJobs,
      pendingReports,
      openIncidents
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw new Error('Failed to load dashboard statistics');
  }
};

/**
 * Get AI-generated daily briefing
 */
export const getDailyBriefing = async (foremanId: string): Promise<DailyBriefing> => {
  try {
    const response = await fetch(`/api/get-daily-briefing?foremanId=${foremanId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch daily briefing');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching daily briefing:', error);
    throw new Error('Failed to load daily briefing');
  }
};

/**
 * Get recent activity for the dashboard
 */
export const getRecentActivity = async (foremanId: string): Promise<RecentActivityItem[]> => {
  try {
    // Fetch all recent data in parallel
    const [jobsResponse, reportsResponse, incidentsResponse] = await Promise.all([
      fetch(`/api/get-foreman-jobs?foremanId=${foremanId}`),
      fetch(`/api/get-reports?foremanId=${foremanId}`),
      fetch(`/api/get-incidents?reporterId=${foremanId}`)
    ]);

    if (!jobsResponse.ok || !reportsResponse.ok || !incidentsResponse.ok) {
      throw new Error('Failed to fetch activity data');
    }

    const [jobs, reports, incidents]: [Job[], FinalQaPack[], IncidentReport[]] = await Promise.all([
      jobsResponse.json(),
      reportsResponse.json(),
      incidentsResponse.json()
    ]);

    // Create activity items
    const activities: RecentActivityItem[] = [];

    // Add recent jobs (last 10)
    jobs.slice(0, 10).forEach(job => {
      activities.push({
        id: job.id,
        type: 'job',
        title: `Job Created: ${job.jobNo}`,
        description: `${job.client} - ${job.projectName}`,
        timestamp: job.jobDate,
        icon: '💼',
        color: 'blue'
      });
    });

    // Add recent reports (last 10)
    reports.slice(0, 10).forEach(report => {
      activities.push({
        id: report.job.id,
        type: 'report',
        title: `Report Submitted: ${report.job.jobNo}`,
        description: `Status: ${report.status || 'Pending Review'}`,
        timestamp: report.timestamp,
        icon: '📊',
        color: 'green'
      });
    });

    // Add recent incidents (last 10)
    incidents.slice(0, 10).forEach(incident => {
      activities.push({
        id: incident.id,
        type: 'incident',
        title: `Incident Reported: ${incident.reportId}`,
        description: `${incident.type} - ${incident.status}`,
        timestamp: incident.dateOfIncident,
        icon: '⚠️',
        color: 'red'
      });
    });

    // Sort by timestamp (most recent first) and return top 10
    activities.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return activities.slice(0, 10);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    throw new Error('Failed to load recent activity');
  }
};

/**
 * Helper function to format relative time
 */
export const getRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};
