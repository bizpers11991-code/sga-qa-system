import React from 'react';
import { SiteMeasurements } from '../../types/project-management';
import { Plus, X } from 'lucide-react';

interface MeasurementsSectionProps {
  value: SiteMeasurements;
  onChange: (value: SiteMeasurements) => void;
}

export function MeasurementsSection({ value, onChange }: MeasurementsSectionProps) {
  const addChainage = () => {
    onChange({
      ...value,
      chainages: [...value.chainages, { start: 0, end: 0 }]
    });
  };

  const removeChainage = (index: number) => {
    onChange({
      ...value,
      chainages: value.chainages.filter((_, i) => i !== index)
    });
  };

  const updateChainage = (index: number, field: 'start' | 'end', val: number) => {
    const newChainages = [...value.chainages];
    newChainages[index] = { ...newChainages[index], [field]: val };
    onChange({ ...value, chainages: newChainages });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Measurements</h3>

      {/* Area */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Area (m²)
        </label>
        <input
          type="number"
          min="0"
          step="0.1"
          value={value.area}
          onChange={(e) => onChange({ ...value, area: parseFloat(e.target.value) || 0 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Depth */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Depth (mm)
        </label>
        <input
          type="number"
          min="0"
          step="1"
          value={value.depth}
          onChange={(e) => onChange({ ...value, depth: parseFloat(e.target.value) || 0 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Chainages */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Chainages
          </label>
          <button
            type="button"
            onClick={addChainage}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </button>
        </div>

        {value.chainages.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No chainages added yet</p>
        ) : (
          <div className="space-y-2">
            {value.chainages.map((chainage, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Start"
                  value={chainage.start}
                  onChange={(e) => updateChainage(index, 'start', parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  placeholder="End"
                  value={chainage.end}
                  onChange={(e) => updateChainage(index, 'end', parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeChainage(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
