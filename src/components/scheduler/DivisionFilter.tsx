import React from 'react';
import { ChevronDown } from 'lucide-react';

type Division = 'All Divisions' | 'Asphalt' | 'Profiling' | 'Spray';

interface DivisionFilterProps {
  selectedDivision: Division;
  onDivisionChange: (division: Division) => void;
}

const divisions: Division[] = ['All Divisions', 'Asphalt', 'Profiling', 'Spray'];

const DivisionFilter: React.FC<DivisionFilterProps> = ({
  selectedDivision,
  onDivisionChange,
}) => {
  return (
    <div className="relative inline-block">
      <label htmlFor="division-filter" className="sr-only">
        Filter by Division
      </label>
      <div className="relative">
        <select
          id="division-filter"
          value={selectedDivision}
          onChange={(e) => onDivisionChange(e.target.value as Division)}
          className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-sga-700 focus:border-transparent cursor-pointer transition-colors"
        >
          {divisions.map((division) => (
            <option key={division} value={division}>
              {division}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>
      </div>
    </div>
  );
};

export default DivisionFilter;
