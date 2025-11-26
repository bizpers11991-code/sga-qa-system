import React from 'react';
import { SiteAccessibility } from '../../types/project-management';
import { Check, X } from 'lucide-react';

interface SiteAccessibilitySectionProps {
  value: SiteAccessibility;
  onChange: (value: SiteAccessibility) => void;
}

const COMMON_RESTRICTIONS = [
  'Traffic Control Required',
  'Limited Access Hours',
  'Permit Required',
  'Residential Area',
  'Heavy Traffic',
  'Narrow Road',
  'Overhead Powerlines',
  'Underground Services'
];

export function SiteAccessibilitySection({ value, onChange }: SiteAccessibilitySectionProps) {
  const toggleRestriction = (restriction: string) => {
    const newRestrictions = value.restrictions.includes(restriction)
      ? value.restrictions.filter(r => r !== restriction)
      : [...value.restrictions, restriction];

    onChange({ ...value, restrictions: newRestrictions });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Site Accessibility</h3>

      {/* Accessible Toggle */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={() => onChange({ ...value, accessible: !value.accessible })}
          className={`flex items-center px-4 py-2 rounded-lg border-2 transition-colors ${
            value.accessible
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-red-500 bg-red-50 text-red-700'
          }`}
        >
          {value.accessible ? (
            <>
              <Check className="w-5 h-5 mr-2" />
              Site is Accessible
            </>
          ) : (
            <>
              <X className="w-5 h-5 mr-2" />
              Site is Not Accessible
            </>
          )}
        </button>
      </div>

      {/* Access Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Access Notes
        </label>
        <textarea
          value={value.accessNotes}
          onChange={(e) => onChange({ ...value, accessNotes: e.target.value })}
          placeholder="Describe access conditions, entry points, parking availability, etc."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Restrictions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Access Restrictions
        </label>
        <div className="grid grid-cols-2 gap-2">
          {COMMON_RESTRICTIONS.map((restriction) => (
            <button
              key={restriction}
              type="button"
              onClick={() => toggleRestriction(restriction)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors text-left ${
                value.restrictions.includes(restriction)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {restriction}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
