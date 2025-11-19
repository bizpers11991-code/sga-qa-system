import React, { useState, useEffect } from 'react';
import { PageContainer, PageHeader } from '../../components/layout';
import WeeklyCalendar from '../../components/scheduler/WeeklyCalendar';
import DivisionFilter from '../../components/scheduler/DivisionFilter';
import { jobsApi } from '../../services/jobsApi';
import { Job } from '../../types';

type Division = 'All Divisions' | 'Asphalt' | 'Profiling' | 'Spray';

const SchedulerPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<Division>('All Divisions');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const allJobs = await jobsApi.getAllJobs();
      setJobs(allJobs);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = selectedDivision === 'All Divisions'
    ? jobs
    : jobs.filter(job => job.division === selectedDivision);

  return (
    <PageContainer maxWidth="full">
      <PageHeader
        title="Scheduler"
        description="Schedule and foreman availability"
      />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Division Filter - Top Right */}
        <div className="flex justify-end p-4 border-b border-gray-200">
          <DivisionFilter
            selectedDivision={selectedDivision}
            onDivisionChange={setSelectedDivision}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 border-4 border-sga-100 border-t-sga-700 rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading schedule...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <p className="text-gray-900 font-medium mb-2">Error Loading Schedule</p>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchJobs}
                className="px-4 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-800 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Calendar */}
        {!loading && !error && (
          <WeeklyCalendar
            jobs={filteredJobs}
            selectedDivision={selectedDivision}
          />
        )}
      </div>
    </PageContainer>
  );
};

export default SchedulerPage;
