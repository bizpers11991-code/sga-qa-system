import React, { useState, useEffect } from 'react';
import { CreateJobRequest } from '../../services/jobsApi';
import { SecureForeman } from '../../types';

interface JobFormWizardProps {
  onSubmit: (data: CreateJobRequest) => Promise<void>;
  initialData?: Partial<CreateJobRequest>;
  foremen: SecureForeman[];
  isLoading?: boolean;
}

type WizardStep = 1 | 2 | 3;

const JobFormWizard: React.FC<JobFormWizardProps> = ({
  onSubmit,
  initialData,
  foremen,
  isLoading = false,
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState<Partial<CreateJobRequest>>({
    jobNo: '',
    client: '',
    division: 'Asphalt',
    projectName: '',
    location: '',
    foremanId: '',
    jobDate: '',
    dueDate: '',
    area: undefined,
    thickness: undefined,
    qaSpec: '',
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter foremen by selected division
  const filteredForemen = foremen.filter((foreman) => {
    if (!formData.division) return true;
    const divisionRoleMap: Record<string, string> = {
      Asphalt: 'asphalt_foreman',
      Profiling: 'profiling_foreman',
      Spray: 'spray_foreman',
    };
    return foreman.role === divisionRoleMap[formData.division];
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateStep = (step: WizardStep): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.jobNo?.trim()) {
        newErrors.jobNo = 'Job number is required';
      }
      if (!formData.client?.trim()) {
        newErrors.client = 'Client is required';
      }
      if (!formData.division) {
        newErrors.division = 'Division is required';
      }
      if (!formData.projectName?.trim()) {
        newErrors.projectName = 'Project name is required';
      }
    }

    if (step === 2) {
      if (!formData.location?.trim()) {
        newErrors.location = 'Location is required';
      }
      if (!formData.jobDate) {
        newErrors.jobDate = 'Job date is required';
      }
      if (!formData.dueDate) {
        newErrors.dueDate = 'Due date is required';
      }
      // Validate that due date is after job date
      if (formData.jobDate && formData.dueDate) {
        const jobDate = new Date(formData.jobDate);
        const dueDate = new Date(formData.dueDate);
        if (dueDate < jobDate) {
          newErrors.dueDate = 'Due date must be on or after job date';
        }
      }
    }

    if (step === 3) {
      if (!formData.foremanId) {
        newErrors.foremanId = 'Foreman assignment is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(3, prev + 1) as WizardStep);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1) as WizardStep);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all steps
    const allStepsValid =
      validateStep(1) && validateStep(2) && validateStep(3);

    if (!allStepsValid) {
      // Go to first step with errors
      if (Object.keys(errors).some((key) => ['jobNo', 'client', 'division', 'projectName'].includes(key))) {
        setCurrentStep(1);
      } else if (Object.keys(errors).some((key) => ['location', 'jobDate', 'dueDate'].includes(key))) {
        setCurrentStep(2);
      } else {
        setCurrentStep(3);
      }
      return;
    }

    const jobData: CreateJobRequest = {
      id: `job-${Date.now()}`,
      jobNo: formData.jobNo!,
      client: formData.client!,
      division: formData.division!,
      projectName: formData.projectName!,
      location: formData.location!,
      foremanId: formData.foremanId!,
      jobDate: formData.jobDate!,
      dueDate: formData.dueDate!,
      area: formData.area,
      thickness: formData.thickness,
      qaSpec: formData.qaSpec,
    };

    await onSubmit(jobData);
  };

  const renderProgressIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {[1, 2, 3].map((step) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  step < currentStep
                    ? 'bg-sga-700 text-white'
                    : step === currentStep
                    ? 'bg-sga-700 text-white ring-4 ring-sga-200'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step < currentStep ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  step
                )}
              </div>
              <span
                className={`text-xs mt-2 font-medium ${
                  step === currentStep ? 'text-sga-700' : 'text-gray-600'
                }`}
              >
                {step === 1 ? 'Basic Info' : step === 2 ? 'Details' : 'Assignment'}
              </span>
            </div>
            {step < 3 && (
              <div
                className={`flex-1 h-1 mx-2 transition-colors ${
                  step < currentStep ? 'bg-sga-700' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>

      <div>
        <label htmlFor="jobNo" className="block text-sm font-medium text-gray-700 mb-1">
          Job Number <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="jobNo"
          name="jobNo"
          value={formData.jobNo || ''}
          onChange={handleInputChange}
          className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sga-500 transition-colors ${
            errors.jobNo ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., JOB-2024-001"
        />
        {errors.jobNo && <p className="mt-1 text-sm text-red-600">{errors.jobNo}</p>}
      </div>

      <div>
        <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
          Client <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="client"
          name="client"
          value={formData.client || ''}
          onChange={handleInputChange}
          className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sga-500 transition-colors ${
            errors.client ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., Main Roads WA"
        />
        {errors.client && <p className="mt-1 text-sm text-red-600">{errors.client}</p>}
      </div>

      <div>
        <label htmlFor="division" className="block text-sm font-medium text-gray-700 mb-1">
          Division <span className="text-red-500">*</span>
        </label>
        <select
          id="division"
          name="division"
          value={formData.division || ''}
          onChange={handleInputChange}
          className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sga-500 transition-colors ${
            errors.division ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="Asphalt">Asphalt</option>
          <option value="Profiling">Profiling</option>
          <option value="Spray">Spray</option>
        </select>
        {errors.division && <p className="mt-1 text-sm text-red-600">{errors.division}</p>}
      </div>

      <div>
        <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
          Project Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="projectName"
          name="projectName"
          value={formData.projectName || ''}
          onChange={handleInputChange}
          className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sga-500 transition-colors ${
            errors.projectName ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., Great Eastern Highway - Stage 2"
        />
        {errors.projectName && (
          <p className="mt-1 text-sm text-red-600">{errors.projectName}</p>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Location and Dates</h2>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
          Location <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location || ''}
          onChange={handleInputChange}
          className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sga-500 transition-colors ${
            errors.location ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., Perth, WA"
        />
        {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="jobDate" className="block text-sm font-medium text-gray-700 mb-1">
            Job Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="jobDate"
            name="jobDate"
            value={formData.jobDate || ''}
            onChange={handleInputChange}
            className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sga-500 transition-colors ${
              errors.jobDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.jobDate && <p className="mt-1 text-sm text-red-600">{errors.jobDate}</p>}
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
            Due Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate || ''}
            onChange={handleInputChange}
            className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sga-500 transition-colors ${
              errors.dueDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.dueDate && <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
            Area (m²)
          </label>
          <input
            type="number"
            id="area"
            name="area"
            value={formData.area || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500 transition-colors"
            placeholder="e.g., 2500"
            min="0"
          />
        </div>

        <div>
          <label htmlFor="thickness" className="block text-sm font-medium text-gray-700 mb-1">
            Thickness (mm)
          </label>
          <input
            type="number"
            id="thickness"
            name="thickness"
            value={formData.thickness || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500 transition-colors"
            placeholder="e.g., 40"
            min="0"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Foreman Assignment and Details
      </h2>

      <div>
        <label htmlFor="foremanId" className="block text-sm font-medium text-gray-700 mb-1">
          Assigned Foreman <span className="text-red-500">*</span>
        </label>
        <select
          id="foremanId"
          name="foremanId"
          value={formData.foremanId || ''}
          onChange={handleInputChange}
          className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sga-500 transition-colors ${
            errors.foremanId ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select a foreman...</option>
          {filteredForemen.length === 0 ? (
            <option value="" disabled>
              No foremen available for {formData.division}
            </option>
          ) : (
            filteredForemen.map((foreman) => (
              <option key={foreman.id} value={foreman.id}>
                {foreman.name} ({foreman.role})
              </option>
            ))
          )}
        </select>
        {errors.foremanId && <p className="mt-1 text-sm text-red-600">{errors.foremanId}</p>}
        {filteredForemen.length === 0 && formData.division && (
          <p className="mt-1 text-sm text-amber-600">
            No foremen available for {formData.division} division. Please contact an administrator.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="qaSpec" className="block text-sm font-medium text-gray-700 mb-1">
          QA Specification
        </label>
        <textarea
          id="qaSpec"
          name="qaSpec"
          value={formData.qaSpec || ''}
          onChange={handleInputChange}
          rows={4}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500 transition-colors"
          placeholder="Enter any specific QA requirements or specifications..."
        />
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Job Summary</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-600">Job Number:</dt>
            <dd className="font-medium text-gray-900">{formData.jobNo || '-'}</dd>
          </div>
          <div>
            <dt className="text-gray-600">Client:</dt>
            <dd className="font-medium text-gray-900">{formData.client || '-'}</dd>
          </div>
          <div>
            <dt className="text-gray-600">Division:</dt>
            <dd className="font-medium text-gray-900">{formData.division || '-'}</dd>
          </div>
          <div>
            <dt className="text-gray-600">Project:</dt>
            <dd className="font-medium text-gray-900">{formData.projectName || '-'}</dd>
          </div>
          <div>
            <dt className="text-gray-600">Location:</dt>
            <dd className="font-medium text-gray-900">{formData.location || '-'}</dd>
          </div>
          <div>
            <dt className="text-gray-600">Job Date:</dt>
            <dd className="font-medium text-gray-900">
              {formData.jobDate
                ? new Date(formData.jobDate).toLocaleDateString('en-AU')
                : '-'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
      {renderProgressIndicator()}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-touch"
        >
          Previous
        </button>

        {currentStep < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2 text-sm font-medium text-white bg-sga-700 rounded-lg hover:bg-sga-600 transition-colors min-h-touch"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 text-sm font-medium text-white bg-sga-700 rounded-lg hover:bg-sga-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-touch"
          >
            {isLoading ? 'Creating Job...' : 'Create Job'}
          </button>
        )}
      </div>
    </form>
  );
};

export default JobFormWizard;
