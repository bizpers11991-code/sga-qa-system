// components/reports/JobSheetForm.tsx

import { useState, useEffect, useCallback } from 'react';
import { DailyJobSheetData, JobMaterial, JobSheetImage } from '../../types';
import MaterialsTable from './MaterialsTable';
import PhotoCapture from './PhotoCapture';
import ReportPreview from './ReportPreview';
import { saveDraft, getDraft, submitReport } from '../../services/reportsApi';
import { saveDraftOffline, getDraftOffline } from '../../utils/offlineStorage';

interface JobSheetFormProps {
  jobNo: string;
  onSubmitSuccess: (reportId: string) => void;
}

const TOTAL_STEPS = 5;
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

const emptyJobSheet: DailyJobSheetData = {
  jobNo: '',
  client: '',
  date: '',
  address: '',
  projectName: '',
  dayShift: true,
  asphaltForeman: '',
  jobMaterials: [],
  jobDetails: [],
  equipment: [],
  jobSheetImages: [],
};

const JobSheetForm = ({ jobNo, onSubmitSuccess }: JobSheetFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<DailyJobSheetData>({ ...emptyJobSheet, jobNo });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Load draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      try {
        // Try to load from server first
        const serverDraft = await getDraft(jobNo);
        if (serverDraft) {
          setFormData(serverDraft.data as DailyJobSheetData);
          setCurrentStep(serverDraft.step);
          setLastSaved(new Date(serverDraft.lastSaved));
          setIsLoading(false);
          return;
        }

        // Try offline storage
        const offlineDraft = await getDraftOffline(`draft-${jobNo}`);
        if (offlineDraft) {
          setFormData(offlineDraft.data as DailyJobSheetData);
          setCurrentStep(offlineDraft.step);
          setLastSaved(new Date(offlineDraft.lastSaved));
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDraft();
  }, [jobNo]);

  // Auto-save
  const saveFormDraft = useCallback(async (silent = false) => {
    if (!silent) setIsSaving(true);

    try {
      const draftData = {
        id: `draft-${jobNo}`,
        jobId: jobNo,
        step: currentStep,
        data: formData,
        lastSaved: new Date().toISOString(),
      };

      // Try to save to server
      if (navigator.onLine) {
        try {
          await saveDraft(draftData);
        } catch (error) {
          console.error('Failed to save draft to server:', error);
          // Fall back to offline storage
          await saveDraftOffline(draftData);
        }
      } else {
        // Save offline if no connection
        await saveDraftOffline(draftData);
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      if (!silent) setIsSaving(false);
    }
  }, [jobNo, currentStep, formData]);

  // Auto-save interval
  useEffect(() => {
    const interval = setInterval(() => {
      saveFormDraft(true);
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [saveFormDraft]);

  const updateFormData = (updates: Partial<DailyJobSheetData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};

    switch (step) {
      case 1:
        if (!formData.jobNo) newErrors.jobNo = 'Job number is required';
        if (!formData.client) newErrors.client = 'Client is required';
        if (!formData.date) newErrors.date = 'Date is required';
        if (!formData.projectName) newErrors.projectName = 'Project name is required';
        if (!formData.address) newErrors.address = 'Address is required';
        if (!formData.asphaltForeman) newErrors.asphaltForeman = 'Foreman is required';
        break;

      case 2:
        if (!formData.jobMaterials || formData.jobMaterials.length === 0) {
          newErrors.jobMaterials = 'At least one material entry is required';
        }
        break;

      case 3:
        if (!formData.equipment || formData.equipment.length === 0) {
          newErrors.equipment = 'At least one equipment entry is required';
        }
        break;

      // Steps 4 and 5 are optional
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (validateStep(currentStep)) {
      await saveFormDraft();
      setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
    }
  };

  const handlePrevious = async () => {
    await saveFormDraft(true);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const finalQaPack = {
        job: {
          id: `job-${Date.now()}`,
          jobNo: formData.jobNo,
          client: formData.client,
          division: 'Asphalt' as const,
          projectName: formData.projectName,
          location: formData.address,
          foremanId: 'current-user-id', // Should come from auth
          jobDate: formData.date,
          dueDate: formData.date,
        },
        jobSheet: formData,
        foremanSignature: '', // Should be captured
        timestamp: new Date().toISOString(),
        version: 1,
        submittedBy: formData.asphaltForeman,
        // Empty QA Pack - would be filled in complete flow
        sgaDailyReport: {} as any,
        siteRecord: {} as any,
        itpChecklist: {} as any,
        asphaltPlacement: {} as any,
        straightEdge: {} as any,
        sitePhotos: [],
        damagePhotos: [],
        lastUpdated: new Date().toISOString(),
      };

      const result = await submitReport(finalQaPack);
      onSubmitSuccess(result.reportId);
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-sga-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of {TOTAL_STEPS}
          </span>
          {lastSaved && (
            <span className="text-xs text-gray-500">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-sga-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-600">Job Info</span>
          <span className="text-xs text-gray-600">Materials</span>
          <span className="text-xs text-gray-600">Equipment</span>
          <span className="text-xs text-gray-600">Photos</span>
          <span className="text-xs text-gray-600">Review</span>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {/* Step 1: Job Selection and Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Job Information</h3>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Job Number *</label>
                  <input
                    type="text"
                    value={formData.jobNo}
                    onChange={(e) => updateFormData({ jobNo: e.target.value })}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.jobNo ? 'border-red-300' : 'border-gray-300'
                    } focus:border-sga-500 focus:ring-sga-500`}
                  />
                  {errors.jobNo && <p className="mt-1 text-sm text-red-600">{errors.jobNo}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Client *</label>
                  <input
                    type="text"
                    value={formData.client}
                    onChange={(e) => updateFormData({ client: e.target.value })}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.client ? 'border-red-300' : 'border-gray-300'
                    } focus:border-sga-500 focus:ring-sga-500`}
                  />
                  {errors.client && <p className="mt-1 text-sm text-red-600">{errors.client}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => updateFormData({ date: e.target.value })}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.date ? 'border-red-300' : 'border-gray-300'
                    } focus:border-sga-500 focus:ring-sga-500`}
                  />
                  {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Shift *</label>
                  <select
                    value={formData.dayShift ? 'day' : 'night'}
                    onChange={(e) => updateFormData({ dayShift: e.target.value === 'day' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sga-500 focus:ring-sga-500 sm:text-sm"
                  >
                    <option value="day">Day Shift</option>
                    <option value="night">Night Shift</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Project Name *</label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) => updateFormData({ projectName: e.target.value })}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.projectName ? 'border-red-300' : 'border-gray-300'
                    } focus:border-sga-500 focus:ring-sga-500`}
                  />
                  {errors.projectName && <p className="mt-1 text-sm text-red-600">{errors.projectName}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Address *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateFormData({ address: e.target.value })}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.address ? 'border-red-300' : 'border-gray-300'
                    } focus:border-sga-500 focus:ring-sga-500`}
                  />
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Foreman *</label>
                  <input
                    type="text"
                    value={formData.asphaltForeman}
                    onChange={(e) => updateFormData({ asphaltForeman: e.target.value })}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.asphaltForeman ? 'border-red-300' : 'border-gray-300'
                    } focus:border-sga-500 focus:ring-sga-500`}
                  />
                  {errors.asphaltForeman && <p className="mt-1 text-sm text-red-600">{errors.asphaltForeman}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Materials Table */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Materials</h3>
              {errors.jobMaterials && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{errors.jobMaterials}</p>
                </div>
              )}
              <MaterialsTable
                materials={formData.jobMaterials || []}
                onChange={(materials) => updateFormData({ jobMaterials: materials })}
              />
            </div>
          )}

          {/* Step 3: Equipment Checklist */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Equipment</h3>
              {errors.equipment && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{errors.equipment}</p>
                </div>
              )}

              <div className="space-y-3">
                {(formData.equipment || []).map((eq, index) => (
                  <div key={index} className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg">
                    <input
                      type="text"
                      placeholder="Item"
                      value={eq.item}
                      onChange={(e) => {
                        const newEquipment = [...(formData.equipment || [])];
                        newEquipment[index] = { ...eq, item: e.target.value };
                        updateFormData({ equipment: newEquipment });
                      }}
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-sga-500 focus:ring-sga-500 sm:text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Vehicle"
                      value={eq.vehicle}
                      onChange={(e) => {
                        const newEquipment = [...(formData.equipment || [])];
                        newEquipment[index] = { ...eq, vehicle: e.target.value };
                        updateFormData({ equipment: newEquipment });
                      }}
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-sga-500 focus:ring-sga-500 sm:text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Fleet No"
                      value={eq.fleetNo}
                      onChange={(e) => {
                        const newEquipment = [...(formData.equipment || [])];
                        newEquipment[index] = { ...eq, fleetNo: e.target.value };
                        updateFormData({ equipment: newEquipment });
                      }}
                      className="w-32 rounded-md border-gray-300 shadow-sm focus:border-sga-500 focus:ring-sga-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newEquipment = (formData.equipment || []).filter((_, i) => i !== index);
                        updateFormData({ equipment: newEquipment });
                      }}
                      className="text-red-600 hover:text-red-900 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    const newEquipment = [
                      ...(formData.equipment || []),
                      { item: '', vehicle: '', fleetNo: '', comments: '' },
                    ];
                    updateFormData({ equipment: newEquipment });
                  }}
                  className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sga-600 hover:bg-sga-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sga-500 min-h-[44px]"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Equipment
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Photos and Notes */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Photos and Notes</h3>

              <PhotoCapture
                photos={formData.jobSheetImages || []}
                onChange={(photos) => updateFormData({ jobSheetImages: photos })}
              />

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
                <textarea
                  rows={4}
                  value={(formData.jobDetails || []).join('\n')}
                  onChange={(e) => updateFormData({ jobDetails: e.target.value.split('\n').filter(d => d) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sga-500 focus:ring-sga-500 sm:text-sm"
                  placeholder="Enter any additional notes (one per line)"
                />
              </div>
            </div>
          )}

          {/* Step 5: Review Summary */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Review and Submit</h3>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Please review all information before submitting. You can go back to edit any section.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">Job Information</span>
                  <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">Materials ({formData.jobMaterials?.length || 0})</span>
                  <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">Equipment ({formData.equipment?.length || 0})</span>
                  <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">Photos ({formData.jobSheetImages?.length || 0})</span>
                  {(formData.jobSheetImages?.length || 0) > 0 ? (
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-xs text-gray-500">Optional</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sga-600 hover:bg-sga-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sga-500 min-h-[44px]"
              >
                Preview and Submit
              </button>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="inline-flex items-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sga-500 min-h-[44px]"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
            )}

            {currentStep < TOTAL_STEPS && (
              <button
                type="button"
                onClick={handleNext}
                disabled={isSaving}
                className="ml-auto inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sga-600 hover:bg-sga-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sga-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                Next
                <svg className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <ReportPreview
        data={formData}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default JobSheetForm;
