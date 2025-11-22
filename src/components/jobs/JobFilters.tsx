import React, { useState, useEffect } from 'react';
import { JobFilters as JobFiltersType } from '../../services/jobsApi';

interface JobFiltersProps {
  onFilterChange: (filters: JobFiltersType) => void;
  initialFilters?: JobFiltersType;
}

const JobFilters: React.FC<JobFiltersProps> = ({ onFilterChange, initialFilters }) => {
  const [filters, setFilters] = useState<JobFiltersType>(
    initialFilters || {
      division: '',
      status: '',
      search: '',
      startDate: '',
      endDate: '',
    }
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange(filters);
    }, 500); // Debounce filter changes

    return () => clearTimeout(timer);
  }, [filters, onFilterChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      division: '',
      status: '',
      search: '',
      startDate: '',
      endDate: '',
    });
  };

  const hasActiveFilters =
    filters.division ||
    filters.status ||
    filters.search ||
    filters.startDate ||
    filters.endDate;

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2">
          <label htmlFor="search" className="sr-only">
            Search
          </label>
          <input
            type="text"
            name="search"
            id="search"
            value={filters.search || ''}
            onChange={handleInputChange}
            placeholder="Search by job number, client, or project..."
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500 focus:border-sga-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="division" className="sr-only">
            Division
          </label>
          <select
            name="division"
            id="division"
            value={filters.division || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500 focus:border-sga-500 transition-colors"
          >
            <option value="">All Divisions</option>
            <option value="Asphalt">Asphalt</option>
            <option value="Profiling">Profiling</option>
            <option value="Spray">Spray</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-touch"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobFilters;
