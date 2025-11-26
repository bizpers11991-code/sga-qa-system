import React from 'react';
import { HazardAssessment } from '../../types/project-management';
import { AlertTriangle, Plus, X } from 'lucide-react';

interface HazardsSectionProps {
  value: HazardAssessment;
  onChange: (value: HazardAssessment) => void;
}

export function HazardsSection({ value, onChange }: HazardsSectionProps) {
  const addHazard = () => {
    onChange({
      ...value,
      identified: true,
      hazardList: [...value.hazardList, { hazard: '', control: '' }]
    });
  };

  const removeHazard = (index: number) => {
    const newList = value.hazardList.filter((_, i) => i !== index);
    onChange({
      ...value,
      hazardList: newList,
      identified: newList.length > 0
    });
  };

  const updateHazard = (index: number, field: 'hazard' | 'control', val: string) => {
    const newList = [...value.hazardList];
    newList[index] = { ...newList[index], [field]: val };
    onChange({ ...value, hazardList: newList });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
          Hazard Assessment
        </h3>
        <button
          type="button"
          onClick={addHazard}
          className="px-3 py-1 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Hazard
        </button>
      </div>

      {/* Hazards Identified Toggle */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={() => onChange({ ...value, identified: !value.identified, hazardList: value.identified ? [] : value.hazardList })}
          className={`flex items-center px-4 py-2 rounded-lg border-2 transition-colors ${
            value.identified
              ? 'border-amber-500 bg-amber-50 text-amber-700'
              : 'border-green-500 bg-green-50 text-green-700'
          }`}
        >
          {value.identified ? (
            <>
              <AlertTriangle className="w-5 h-5 mr-2" />
              Hazards Identified
            </>
          ) : (
            <>No Hazards Identified</>
          )}
        </button>
      </div>

      {/* Hazard List */}
      {value.identified && (
        <div className="space-y-3">
          {value.hazardList.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No hazards added yet. Click "Add Hazard" to begin.</p>
          ) : (
            value.hazardList.map((item, index) => (
              <div key={index} className="p-4 border border-amber-200 rounded-lg bg-amber-50">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-medium text-amber-900">Hazard #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeHazard(index)}
                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hazard Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Overhead powerlines, Heavy traffic, Uneven surface"
                      value={item.hazard}
                      onChange={(e) => updateHazard(index, 'hazard', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Control Measures
                    </label>
                    <textarea
                      placeholder="Describe the controls in place to mitigate this hazard"
                      value={item.control}
                      onChange={(e) => updateHazard(index, 'control', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
