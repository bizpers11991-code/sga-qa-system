// pages/Dashboard.tsx

import React, { useEffect, useState } from 'react';
import { PageContainer, PageHeader } from '../components/layout';
import useAuth from '../hooks/useAuth';
import StatsCard from '../components/dashboard/StatsCard';
import QuickActions from '../components/dashboard/QuickActions';
import RecentActivity from '../components/dashboard/RecentActivity';
import DailyBriefing from '../components/dashboard/DailyBriefing';
import { WeatherWidget } from '../components/weather';
import {
  getDashboardStats,
  getDailyBriefing,
  getRecentActivity,
  DashboardStats,
  RecentActivityItem
} from '../services/dashboardApi';

const Dashboard = () => {
  const { user } = useAuth();

  // State management
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [activities, setActivities] = useState<RecentActivityItem[]>([]);

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingBriefing, setLoadingBriefing] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const [statsError, setStatsError] = useState<string | null>(null);
  const [briefingError, setBriefingError] = useState<string | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);

  // Get user's name and ID from MSAL account
  const userName = user?.name || user?.username || 'User';
  const userId = user?.localAccountId || user?.homeAccountId || '';

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!userId) return;

    setLoadingStats(true);
    setLoadingBriefing(true);
    setLoadingActivity(true);
    setStatsError(null);
    setBriefingError(null);
    setActivityError(null);

    try {
      // Fetch stats
      const statsData = await getDashboardStats(userId);
      setStats(statsData);
      setLoadingStats(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      setStatsError('Failed to load statistics');
      setLoadingStats(false);
    }

    try {
      // Fetch daily briefing
      const briefingData = await getDailyBriefing(userId);
      setBriefing(briefingData.summary);
      setLoadingBriefing(false);
    } catch (error) {
      console.error('Error loading briefing:', error);
      setBriefingError('Failed to load daily briefing');
      setLoadingBriefing(false);
    }

    try {
      // Fetch recent activity
      const activityData = await getRecentActivity(userId);
      setActivities(activityData);
      setLoadingActivity(false);
    } catch (error) {
      console.error('Error loading activity:', error);
      setActivityError('Failed to load recent activity');
      setLoadingActivity(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  // Refresh handlers
  const handleRefreshStats = () => {
    fetchDashboardData();
  };

  const handleRefreshBriefing = async () => {
    if (!userId) return;

    setLoadingBriefing(true);
    setBriefingError(null);

    try {
      const briefingData = await getDailyBriefing(userId);
      setBriefing(briefingData.summary);
      setLoadingBriefing(false);
    } catch (error) {
      console.error('Error loading briefing:', error);
      setBriefingError('Failed to load daily briefing');
      setLoadingBriefing(false);
    }
  };

  const handleRefreshActivity = async () => {
    if (!userId) return;

    setLoadingActivity(true);
    setActivityError(null);

    try {
      const activityData = await getRecentActivity(userId);
      setActivities(activityData);
      setLoadingActivity(false);
    } catch (error) {
      console.error('Error loading activity:', error);
      setActivityError('Failed to load recent activity');
      setLoadingActivity(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Quality Assurance Dashboard"
        description="Enterprise quality assurance application for Safety Grooving Australia"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Dashboard' }
        ]}
        actions={
          <button
            onClick={handleRefreshStats}
            className="px-4 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium min-h-touch"
            aria-label="Refresh dashboard"
          >
            <span className="mr-2">🔄</span> Refresh
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {statsError ? (
          <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-700 font-medium mb-2">Failed to Load Statistics</p>
            <button
              onClick={handleRefreshStats}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <StatsCard
              title="Active Jobs"
              value={stats?.activeJobs ?? 0}
              subtitle="Last 30 days"
              icon="💼"
              color="blue"
              loading={loadingStats}
            />
            <StatsCard
              title="Pending Reports"
              value={stats?.pendingReports ?? 0}
              subtitle="Awaiting action"
              icon="📄"
              color="amber"
              loading={loadingStats}
            />
            <StatsCard
              title="Open Incidents"
              value={stats?.openIncidents ?? 0}
              subtitle="Under investigation"
              icon="⚠️"
              color="red"
              loading={loadingStats}
            />
          </>
        )}
      </div>

      {/* Welcome Section with Daily Briefing */}
      <DailyBriefing
        summary={briefing}
        loading={loadingBriefing}
        error={briefingError}
        onRefresh={handleRefreshBriefing}
      />

      {/* Weather and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Weather Widget - takes 1/3 width on large screens */}
        <div className="lg:col-span-1">
          <WeatherWidget
            showWorkSuitability={true}
            expanded={false}
            refreshInterval={30}
          />
        </div>

        {/* Quick Actions - takes 2/3 width on large screens */}
        <div className="lg:col-span-2">
          <QuickActions />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6">
        <RecentActivity
          activities={activities}
          loading={loadingActivity}
          onRefresh={handleRefreshActivity}
        />
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-green-900 text-sm">API Services</p>
              <p className="text-xs text-green-700 mt-0.5">All systems operational</p>
            </div>
            <span className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0 ml-3"></span>
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-green-900 text-sm">Database</p>
              <p className="text-xs text-green-700 mt-0.5">Connected and healthy</p>
            </div>
            <span className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0 ml-3"></span>
          </div>
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-blue-900 text-sm">Authentication</p>
              <p className="text-xs text-blue-700 mt-0.5">Azure MSAL active</p>
            </div>
            <span className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 ml-3"></span>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-sga-100 to-sga-50 rounded-lg border border-sga-200 p-6 mt-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Welcome back, {userName}!
            </h2>
            <p className="text-gray-700 text-sm mb-1">
              Enterprise quality assurance application for Safety Grooving Australia
            </p>
            <p className="text-gray-600 text-xs">
              Integrated with Microsoft 365 ecosystem (Dataverse, SharePoint, Entra ID)
            </p>
          </div>
          <div className="w-16 h-16 bg-sga-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-3xl" role="img" aria-label="Construction">
              🚧
            </span>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
