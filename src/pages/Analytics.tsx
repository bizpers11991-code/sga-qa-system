/**
 * Analytics Dashboard Page
 *
 * Provides comprehensive analytics and KPIs for management:
 * - Job completion trends
 * - Division performance
 * - Incident tracking
 * - QA pack status
 * - Resource utilization
 */

import React, { useEffect, useState } from 'react';
import { PageContainer, PageHeader } from '../components/layout';

interface DashboardStats {
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
  jobsCompletionTrend?: { date: string; completed: number }[];
  incidentsTrend?: { month: string; count: number; type: Record<string, number> }[];
}

const Analytics: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const response = await fetch(
        `/api/get-dashboard-stats?include=jobsTrend,incidentsTrend&trendDays=${days}&trendMonths=6`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  // Calculate percentages for charts
  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  // Get color for status
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Completed: 'bg-green-500',
      'In Progress': 'bg-blue-500',
      Pending: 'bg-yellow-500',
      Scheduled: 'bg-purple-500',
      Cancelled: 'bg-gray-500',
      Scoping: 'bg-indigo-500',
      Active: 'bg-teal-500',
    };
    return colors[status] || 'bg-gray-400';
  };

  const getDivisionColor = (division: string) => {
    const colors: Record<string, string> = {
      Asphalt: 'bg-orange-500',
      Profiling: 'bg-blue-500',
      Spray: 'bg-green-500',
    };
    return colors[division] || 'bg-gray-400';
  };

  if (loading && !stats) {
    return (
      <PageContainer>
        <PageHeader title="Analytics Dashboard" description="Loading analytics data..." />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sga-600"></div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader title="Analytics Dashboard" description="Error loading data" />
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </PageContainer>
    );
  }

  const totalJobsByStatus = Object.values(stats?.jobsByStatus || {}).reduce((a, b) => a + b, 0);
  const totalJobsByDivision = Object.values(stats?.jobsByDivision || {}).reduce((a, b) => a + b, 0);

  return (
    <PageContainer>
      <PageHeader
        title="Analytics Dashboard"
        description="Performance metrics and trends for SGA QA System"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Analytics' },
        ]}
        actions={
          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <button
              onClick={fetchStats}
              className="px-4 py-2 bg-sga-600 text-white rounded-lg hover:bg-sga-700"
            >
              Refresh
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{stats?.totalJobs || 0}</div>
          <div className="text-sm text-gray-500">Total Jobs</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{stats?.totalProjects || 0}</div>
          <div className="text-sm text-gray-500">Active Projects</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">{stats?.incidentsThisMonth || 0}</div>
          <div className="text-sm text-gray-500">Incidents This Month</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-amber-600">{stats?.openNCRs || 0}</div>
          <div className="text-sm text-gray-500">Open NCRs</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Jobs by Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Jobs by Status</h3>
          <div className="space-y-3">
            {Object.entries(stats?.jobsByStatus || {}).map(([status, count]) => (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{status}</span>
                  <span className="font-medium">{count} ({calculatePercentage(count, totalJobsByStatus)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${getStatusColor(status)}`}
                    style={{ width: `${calculatePercentage(count, totalJobsByStatus)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          {Object.keys(stats?.jobsByStatus || {}).length === 0 && (
            <p className="text-gray-500 text-center py-4">No job data available</p>
          )}
        </div>

        {/* Jobs by Division */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Jobs by Division</h3>
          <div className="space-y-3">
            {Object.entries(stats?.jobsByDivision || {}).map(([division, count]) => (
              <div key={division}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{division}</span>
                  <span className="font-medium">{count} ({calculatePercentage(count, totalJobsByDivision)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${getDivisionColor(division)}`}
                    style={{ width: `${calculatePercentage(count, totalJobsByDivision)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          {Object.keys(stats?.jobsByDivision || {}).length === 0 && (
            <p className="text-gray-500 text-center py-4">No division data available</p>
          )}
        </div>
      </div>

      {/* Jobs Completion Trend */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Jobs Completion Trend</h3>
        {stats?.jobsCompletionTrend && stats.jobsCompletionTrend.length > 0 ? (
          <div className="h-48 flex items-end gap-1">
            {stats.jobsCompletionTrend.slice(-30).map((day, index) => {
              const maxCompleted = Math.max(...stats.jobsCompletionTrend!.map(d => d.completed), 1);
              const height = (day.completed / maxCompleted) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center group relative">
                  <div
                    className="w-full bg-sga-500 rounded-t transition-all hover:bg-sga-600"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  ></div>
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    {day.date}: {day.completed} completed
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No trend data available</p>
        )}
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{stats?.jobsCompletionTrend?.[0]?.date || 'Start'}</span>
          <span>{stats?.jobsCompletionTrend?.[stats.jobsCompletionTrend.length - 1]?.date || 'End'}</span>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Projects by Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Projects by Status</h3>
          <div className="space-y-3">
            {Object.entries(stats?.projectsByStatus || {}).map(([status, count]) => (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{status}</span>
                  <span className="font-medium">{count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${getStatusColor(status)}`}
                    style={{ width: `${calculatePercentage(count, stats?.totalProjects || 1)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          {Object.keys(stats?.projectsByStatus || {}).length === 0 && (
            <p className="text-gray-500 text-center py-4">No project data available</p>
          )}
        </div>

        {/* Incidents Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Incidents Trend (6 Months)</h3>
          {stats?.incidentsTrend && stats.incidentsTrend.length > 0 ? (
            <div className="h-40 flex items-end justify-between gap-2">
              {stats.incidentsTrend.map((month, index) => {
                const maxCount = Math.max(...stats.incidentsTrend!.map(m => m.count), 1);
                const height = (month.count / maxCount) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-red-400 rounded-t transition-all hover:bg-red-500"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2">{month.month}</span>
                    <span className="text-xs font-medium">{month.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No incident trend data available</p>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6 border border-green-200">
          <h4 className="text-lg font-semibold text-green-900 mb-2">Completion Rate</h4>
          <div className="text-3xl font-bold text-green-700">
            {stats?.jobsByStatus?.Completed
              ? calculatePercentage(stats.jobsByStatus.Completed, totalJobsByStatus)
              : 0}%
          </div>
          <p className="text-sm text-green-600 mt-1">Jobs completed successfully</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-6 border border-blue-200">
          <h4 className="text-lg font-semibold text-blue-900 mb-2">QA Packs Pending</h4>
          <div className="text-3xl font-bold text-blue-700">{stats?.pendingQAPacks || 0}</div>
          <p className="text-sm text-blue-600 mt-1">Awaiting review or submission</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow p-6 border border-amber-200">
          <h4 className="text-lg font-semibold text-amber-900 mb-2">Safety Score</h4>
          <div className="text-3xl font-bold text-amber-700">
            {stats?.totalIncidents === 0
              ? '100%'
              : `${Math.max(0, 100 - (stats?.incidentsThisMonth || 0) * 5)}%`}
          </div>
          <p className="text-sm text-amber-600 mt-1">Based on incident frequency</p>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500 mt-6">
        Last updated: {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'Never'}
      </div>
    </PageContainer>
  );
};

export default Analytics;
