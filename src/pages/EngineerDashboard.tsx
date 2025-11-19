// pages/EngineerDashboard.tsx

import React, { useEffect, useState } from 'react';
import { PageContainer, PageHeader } from '../components/layout';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import StatsCard from '../components/dashboard/StatsCard';
import { getDashboardStats, DashboardStats } from '../services/dashboardApi';
import { jobsApi } from '../services/jobsApi';
import { Job, FinalQaPack } from '../types';

const EngineerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<FinalQaPack[]>([]);

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);

  const [statsError, setStatsError] = useState<string | null>(null);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);

  const userId = user?.localAccountId || user?.homeAccountId || '';

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!userId) return;

    // Fetch stats
    setLoadingStats(true);
    setStatsError(null);
    try {
      const statsData = await getDashboardStats(userId);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
      setStatsError('Failed to load statistics');
    } finally {
      setLoadingStats(false);
    }

    // Fetch all jobs
    setLoadingJobs(true);
    setJobsError(null);
    try {
      const allJobs = await jobsApi.getAllJobs();

      // Filter for active and overdue jobs
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const activeAndOverdueJobs = allJobs.filter(job => {
        const dueDate = new Date(job.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        // Show jobs that are due today or overdue
        return dueDate <= today;
      });

      setJobs(activeAndOverdueJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
      setJobsError('Failed to load jobs');
    } finally {
      setLoadingJobs(false);
    }

    // Fetch recent submissions
    setLoadingSubmissions(true);
    setSubmissionsError(null);
    try {
      const response = await fetch(`/api/get-reports?foremanId=${userId}`);
      if (response.ok) {
        const submissions: FinalQaPack[] = await response.json();
        // Sort by timestamp (most recent first) and take top 5
        const sorted = submissions.sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setRecentSubmissions(sorted.slice(0, 5));
      } else {
        throw new Error('Failed to fetch submissions');
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
      setSubmissionsError('Failed to load recent submissions');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  // Handle job deletion
  const handleDeleteJob = async (jobId: string, jobNo: string) => {
    if (!window.confirm(`Are you sure you want to delete job ${jobNo}? This action cannot be undone.`)) {
      return;
    }

    try {
      await jobsApi.deleteJob(jobId);
      // Refresh jobs list
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      // Show success message (could use a toast notification)
      alert(`Job ${jobNo} deleted successfully`);
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job. Please try again.');
    }
  };

  // Calculate additional stats
  const reportsSubmittedToday = recentSubmissions.filter(submission => {
    const today = new Date();
    const submissionDate = new Date(submission.timestamp);
    return (
      submissionDate.getDate() === today.getDate() &&
      submissionDate.getMonth() === today.getMonth() &&
      submissionDate.getFullYear() === today.getFullYear()
    );
  }).length;

  const activeAndOverdueCount = jobs.length;

  const upcomingJobs = stats?.activeJobs || 0;

  // Unassigned jobs would need a separate API call or filter
  const unassignedJobs = 0;

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if job is overdue
  const isOverdue = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  return (
    <PageContainer>
      <PageHeader
        title="Engineer's Overview"
        description="At-a-glance project health and compliance status"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Dashboard' }
        ]}
        actions={
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium min-h-touch"
            aria-label="Refresh dashboard"
          >
            <span className="mr-2">🔄</span> Refresh
          </button>
        }
      />

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Reports Submitted Today"
          value={reportsSubmittedToday}
          subtitle="QA Packs completed"
          icon="✅"
          color="green"
          loading={loadingStats}
        />
        <StatsCard
          title="Active & Overdue Jobs"
          value={activeAndOverdueCount}
          subtitle="Require immediate attention"
          icon="⚠️"
          color="red"
          loading={loadingJobs}
        />
        <StatsCard
          title="Upcoming Jobs"
          value={upcomingJobs}
          subtitle="Scheduled this month"
          icon="📅"
          color="blue"
          loading={loadingStats}
        />
        <StatsCard
          title="Unassigned Jobs"
          value={unassignedJobs}
          subtitle="Awaiting assignment"
          icon="❓"
          color="green"
          loading={loadingStats}
        />
      </div>

      {/* Latest Submissions Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Latest Submissions</h3>
            <button
              onClick={() => navigate('/reports')}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
            >
              View all →
            </button>
          </div>

          {loadingSubmissions ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-gray-50 rounded-lg p-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : submissionsError ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">{submissionsError}</p>
              <button
                onClick={fetchDashboardData}
                className="text-sm text-orange-600 hover:text-orange-700"
              >
                Try again
              </button>
            </div>
          ) : recentSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">📊</div>
              <p className="text-gray-500 font-medium">No submissions yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Recent QA Pack submissions will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSubmissions.map((submission) => (
                <div
                  key={submission.job.id}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate('/reports')}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">
                        {submission.job.jobNo} - {submission.job.client}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Submitted by: {submission.submittedBy}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(submission.timestamp)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full flex-shrink-0 ml-3 ${
                        submission.status === 'Approved'
                          ? 'bg-green-100 text-green-800'
                          : submission.status === 'Requires Action'
                          ? 'bg-red-100 text-red-800'
                          : submission.status === 'Archived'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {submission.status || 'Pending Review'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active & Overdue Jobs Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Active & Overdue Jobs</h3>
            <button
              onClick={() => navigate('/jobs')}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
            >
              View all →
            </button>
          </div>

          {loadingJobs ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-gray-50 rounded-lg p-4">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : jobsError ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">{jobsError}</p>
              <button
                onClick={fetchDashboardData}
                className="text-sm text-orange-600 hover:text-orange-700"
              >
                Try again
              </button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">✅</div>
              <p className="text-gray-500 font-medium">All caught up!</p>
              <p className="text-sm text-gray-400 mt-1">
                No active or overdue jobs at the moment
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className={`bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors ${
                    isOverdue(job.dueDate) ? 'border-l-4 border-red-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">
                        {job.jobNo} - {job.client}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Foreman: {job.foremanId}
                      </p>
                      <p
                        className={`text-xs mt-1 font-medium ${
                          isOverdue(job.dueDate) ? 'text-red-600' : 'text-gray-500'
                        }`}
                      >
                        Due: {new Date(job.dueDate).toLocaleDateString('en-AU', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                        {isOverdue(job.dueDate) && ' (OVERDUE)'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                      <button
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium min-h-touch"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id, job.jobNo)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium min-h-touch"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default EngineerDashboard;
