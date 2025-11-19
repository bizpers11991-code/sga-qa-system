import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Job } from '../../types';
import CalendarJobCard from './CalendarJobCard';

interface WeeklyCalendarProps {
  jobs: Job[];
  selectedDivision: string;
}

interface DayColumn {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayName: string;
  dayNumber: string;
  isToday: boolean;
  jobs: Job[];
}

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ jobs, selectedDivision }) => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()));

  // Get Monday of the given date
  function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  // Format date as YYYY-MM-DD
  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Format day display (e.g., "Mon 27/10")
  function formatDayDisplay(date: Date): { dayName: string; dayNumber: string } {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const dayNumber = `${day}/${month < 10 ? '0' + month : month}`;
    return { dayName, dayNumber };
  }

  // Check if date is today
  function isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  // Generate week columns
  const weekColumns: DayColumn[] = useMemo(() => {
    const columns: DayColumn[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      const dateString = formatDate(date);
      const { dayName, dayNumber } = formatDayDisplay(date);

      // Filter jobs for this date
      const dayJobs = jobs.filter(job => {
        // Normalize job date to YYYY-MM-DD format
        const jobDateStr = job.jobDate.split('T')[0];
        return jobDateStr === dateString;
      });

      columns.push({
        date,
        dateString,
        dayName,
        dayNumber,
        isToday: isToday(date),
        jobs: dayJobs,
      });
    }
    return columns;
  }, [currentWeekStart, jobs]);

  // Navigation handlers
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    setCurrentWeekStart(getMonday(new Date()));
  };

  // Get week range display
  const weekRangeDisplay = useMemo(() => {
    const startDate = currentWeekStart;
    const endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 6);

    const startMonth = startDate.toLocaleString('default', { month: 'short' });
    const endMonth = endDate.toLocaleString('default', { month: 'short' });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const year = startDate.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  }, [currentWeekStart]);

  // Empty state message
  const totalJobsInWeek = weekColumns.reduce((sum, col) => sum + col.jobs.length, 0);
  const emptyMessage = selectedDivision === 'All Divisions'
    ? 'No jobs scheduled for this week'
    : `No ${selectedDivision} jobs scheduled for this week`;

  return (
    <div className="p-4">
      {/* Navigation Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={goToPreviousWeek}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Previous Week"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <h2 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
            {weekRangeDisplay}
          </h2>

          <button
            onClick={goToNextWeek}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Next Week"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <button
          onClick={goToToday}
          className="flex items-center gap-2 px-4 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-800 transition-colors text-sm font-medium"
        >
          <CalendarIcon className="w-4 h-4" />
          Today
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
        {weekColumns.map((column, index) => (
          <div
            key={column.dateString}
            className={`
              bg-white min-h-[500px] flex flex-col
              ${column.isToday ? 'bg-blue-50' : ''}
            `}
          >
            {/* Day Header */}
            <div
              className={`
                p-3 text-center border-b border-gray-200
                ${column.isToday ? 'bg-blue-100 font-bold' : 'bg-gray-50'}
              `}
            >
              <div className={`text-sm font-semibold ${column.isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                {column.dayName}
              </div>
              <div className={`text-xs mt-1 ${column.isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                {column.dayNumber}
              </div>
            </div>

            {/* Jobs for this day */}
            <div className="p-2 flex-1 overflow-y-auto">
              {column.jobs.length > 0 ? (
                column.jobs.map((job) => (
                  <CalendarJobCard
                    key={job.id}
                    job={job}
                    foremanName={job.foremanId || undefined}
                  />
                ))
              ) : (
                <div className="text-center text-gray-400 text-xs py-4">
                  No jobs
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State - Show below calendar if no jobs in entire week */}
      {totalJobsInWeek === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-3">
            <CalendarIcon className="w-16 h-16 mx-auto text-gray-300" />
          </div>
          <p className="text-gray-600 font-medium">{emptyMessage}</p>
          <p className="text-gray-500 text-sm mt-2">
            Try navigating to a different week or changing the division filter.
          </p>
        </div>
      )}
    </div>
  );
};

export default WeeklyCalendar;
