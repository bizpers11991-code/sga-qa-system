import React, { useState } from 'react';
import { Users, Search } from 'lucide-react';

interface Crew {
  id: string;
  name: string;
  division: string;
  foreman: string;
  available: boolean;
}

interface CrewAssignmentSelectorProps {
  division: 'Asphalt' | 'Profiling' | 'Spray';
  selectedCrewId?: string;
  selectedForemanId?: string;
  onSelectCrew: (crewId: string, foremanId: string) => void;
}

/**
 * Component for selecting crew and foreman for a division request
 * In a real implementation, this would fetch crew data from the API
 */
export function CrewAssignmentSelector({
  division,
  selectedCrewId,
  selectedForemanId,
  onSelectCrew
}: CrewAssignmentSelectorProps) {
  // Mock crew data - in production, this would come from API
  const [crews] = useState<Crew[]>([
    { id: 'CREW_A1', name: 'Asphalt Crew A', division: 'Asphalt', foreman: 'John Smith', available: true },
    { id: 'CREW_A2', name: 'Asphalt Crew B', division: 'Asphalt', foreman: 'Mike Davis', available: false },
    { id: 'CREW_A3', name: 'Asphalt Crew C', division: 'Asphalt', foreman: 'Tom Wilson', available: true },
    { id: 'CREW_P1', name: 'Profiling Crew 1', division: 'Profiling', foreman: 'Sarah Jones', available: true },
    { id: 'CREW_P2', name: 'Profiling Crew 2', division: 'Profiling', foreman: 'Emma Brown', available: true },
    { id: 'CREW_S1', name: 'Spray Crew 1', division: 'Spray', foreman: 'Alex Lee', available: false },
    { id: 'CREW_S2', name: 'Spray Crew 2', division: 'Spray', foreman: 'Chris Taylor', available: true },
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  // Filter crews by division and search term
  const filteredCrews = crews.filter(crew => {
    const matchesDivision = crew.division === division;
    const matchesSearch = crew.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          crew.foreman.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDivision && matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Assign Crew</h3>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search crews or foremen..."
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Crew List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredCrews.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No crews found for {division} division
          </p>
        ) : (
          filteredCrews.map(crew => (
            <button
              key={crew.id}
              onClick={() => onSelectCrew(crew.id, crew.foreman)}
              disabled={!crew.available}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                selectedCrewId === crew.id
                  ? 'border-blue-500 bg-blue-50'
                  : crew.available
                  ? 'border-gray-200 hover:border-gray-300 bg-white'
                  : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{crew.name}</p>
                  <p className="text-sm text-gray-600">Foreman: {crew.foreman}</p>
                </div>
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    crew.available
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {crew.available ? 'Available' : 'Assigned'}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Selected Info */}
      {selectedCrewId && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-900">Selected:</p>
          <p className="text-sm text-blue-800">
            Crew: {crews.find(c => c.id === selectedCrewId)?.name}
          </p>
          <p className="text-sm text-blue-800">
            Foreman: {selectedForemanId}
          </p>
        </div>
      )}
    </div>
  );
}
