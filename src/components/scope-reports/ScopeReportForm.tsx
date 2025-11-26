import React, { useState } from 'react';
import { ScopeReport } from '../../types/project-management';
import { SiteAccessibilitySection } from './SiteAccessibilitySection';
import { SurfaceConditionSection } from './SurfaceConditionSection';
import { MeasurementsSection } from './MeasurementsSection';
import { HazardsSection } from './HazardsSection';
import { ChevronRight, ChevronLeft, Save, Send } from 'lucide-react';

interface ScopeReportFormProps {
  initialData?: Partial<ScopeReport>;
  projectId: string;
  onSave: (report: Partial<ScopeReport>) => Promise<void>;
  onSubmit: (report: Partial<ScopeReport>) => Promise<void>;
}

const INITIAL_REPORT: Partial<ScopeReport> = {
  siteAccessibility: { accessible: true, accessNotes: '', restrictions: [] },
  surfaceCondition: { currentCondition: 'Good', defects: [], photos: [] },
  measurements: { area: 0, depth: 0, chainages: [] },
  trafficManagement: { required: false, tmpRequired: false, restrictions: [], notes: '' },
  utilities: { identified: false, services: [], photos: [] },
  hazards: { identified: false, hazardList: [] },
  recommendations: '',
  estimatedDuration: 1,
  photos: []
};

export function ScopeReportForm({ initialData, projectId, onSave, onSubmit }: ScopeReportFormProps) {
  const [formData, setFormData] = useState<Partial<ScopeReport>>({
    ...INITIAL_REPORT,
    ...initialData,
    projectId
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const steps = [
    { title: 'Site Access', component: SiteAccessibilitySection, field: 'siteAccessibility' },
    { title: 'Surface Condition', component: SurfaceConditionSection, field: 'surfaceCondition' },
    { title: 'Measurements', component: MeasurementsSection, field: 'measurements' },
    { title: 'Hazards', component: HazardsSection, field: 'hazards' }
  ];

  const currentStepData = steps[currentStep];
  const StepComponent = currentStepData.component;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await onSave({ ...formData, status: 'Draft' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ ...formData, status: 'Submitted' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.title}>
              <button
                type="button"
                onClick={() => setCurrentStep(index)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  index === currentStep
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : index < currentStep
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-400 border-b-2 border-gray-200'
                }`}
              >
                {step.title}
              </button>
              {index < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Current Step */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <StepComponent
          value={(formData as any)[currentStepData.field] || {}}
          onChange={(value: any) =>
            setFormData({ ...formData, [currentStepData.field]: value })
          }
        />
      </div>

      {/* Final Step: Recommendations & Duration */}
      {currentStep === steps.length && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Summary & Recommendations</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recommendations
            </label>
            <textarea
              value={formData.recommendations}
              onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
              placeholder="Provide recommendations for the project based on your site assessment..."
              rows={5}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Duration (days)
            </label>
            <input
              type="number"
              min="1"
              value={formData.estimatedDuration}
              onChange={(e) =>
                setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) || 1 })
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </button>

        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={saving}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Draft'}
        </button>

        {currentStep < steps.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center disabled:opacity-50"
          >
            <Send className="w-4 h-4 mr-2" />
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        )}
      </div>
    </form>
  );
}
