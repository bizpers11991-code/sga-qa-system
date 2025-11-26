import React, { useState } from 'react';
import { DivisionRequest } from '../../types/project-management';
import { Calendar, MapPin, FileText, Send } from 'lucide-react';

interface DivisionRequestFormProps {
  projectId: string;
  projectName: string;
  requestedBy: string;
  onSubmit: (request: Partial<DivisionRequest>) => Promise<void>;
  onCancel: () => void;
}

/**
 * Form component for creating a new division request
 */
export function DivisionRequestForm({
  projectId,
  projectName,
  requestedBy,
  onSubmit,
  onCancel
}: DivisionRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    requestedDivision: '' as 'Profiling' | 'Spray' | 'Asphalt' | '',
    requestedTo: '',
    workDescription: '',
    location: '',
    requestedDates: ['']
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.requestedDivision) {
      newErrors.requestedDivision = 'Division is required';
    }

    if (!formData.requestedTo) {
      newErrors.requestedTo = 'Division engineer is required';
    }

    if (!formData.workDescription.trim()) {
      newErrors.workDescription = 'Work description is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (formData.requestedDates.filter(d => d.trim()).length === 0) {
      newErrors.requestedDates = 'At least one date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const request: Partial<DivisionRequest> = {
        projectId,
        requestedBy,
        requestedDivision: formData.requestedDivision as 'Profiling' | 'Spray' | 'Asphalt',
        requestedTo: formData.requestedTo,
        workDescription: formData.workDescription,
        location: formData.location,
        requestedDates: formData.requestedDates.filter(d => d.trim()),
        status: 'Pending'
      };

      await onSubmit(request);
    } catch (error) {
      console.error('Failed to create division request:', error);
    } finally {
      setLoading(false);
    }
  };

  const addDateField = () => {
    setFormData(prev => ({
      ...prev,
      requestedDates: [...prev.requestedDates, '']
    }));
  };

  const removeDateField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requestedDates: prev.requestedDates.filter((_, i) => i !== index)
    }));
  };

  const updateDate = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      requestedDates: prev.requestedDates.map((d, i) => i === index ? value : d)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Division Request</h2>

      {/* Project Info */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-1">Project</h3>
        <p className="text-blue-800">{projectName}</p>
        <p className="text-sm text-blue-600">ID: {projectId}</p>
      </div>

      {/* Division Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Requesting Division *
        </label>
        <select
          value={formData.requestedDivision}
          onChange={(e) => setFormData(prev => ({ ...prev, requestedDivision: e.target.value as any }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select division...</option>
          <option value="Asphalt">Asphalt</option>
          <option value="Profiling">Profiling</option>
          <option value="Spray">Spray</option>
        </select>
        {errors.requestedDivision && (
          <p className="text-red-600 text-sm mt-1">{errors.requestedDivision}</p>
        )}
      </div>

      {/* Division Engineer */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Division Engineer *
        </label>
        <input
          type="text"
          value={formData.requestedTo}
          onChange={(e) => setFormData(prev => ({ ...prev, requestedTo: e.target.value }))}
          placeholder="Engineer ID or email"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
        {errors.requestedTo && (
          <p className="text-red-600 text-sm mt-1">{errors.requestedTo}</p>
        )}
      </div>

      {/* Work Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FileText className="w-4 h-4 inline mr-1" />
          Work Description *
        </label>
        <textarea
          value={formData.workDescription}
          onChange={(e) => setFormData(prev => ({ ...prev, workDescription: e.target.value }))}
          placeholder="Describe the work required..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
        {errors.workDescription && (
          <p className="text-red-600 text-sm mt-1">{errors.workDescription}</p>
        )}
      </div>

      {/* Location */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="w-4 h-4 inline mr-1" />
          Location *
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          placeholder="Work location..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
        {errors.location && (
          <p className="text-red-600 text-sm mt-1">{errors.location}</p>
        )}
      </div>

      {/* Requested Dates */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar className="w-4 h-4 inline mr-1" />
          Requested Dates *
        </label>
        {formData.requestedDates.map((date, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="date"
              value={date}
              onChange={(e) => updateDate(index, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            {formData.requestedDates.length > 1 && (
              <button
                type="button"
                onClick={() => removeDateField(index)}
                className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addDateField}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          + Add Another Date
        </button>
        {errors.requestedDates && (
          <p className="text-red-600 text-sm mt-1">{errors.requestedDates}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>Processing...</>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Request
            </>
          )}
        </button>
      </div>
    </form>
  );
}
