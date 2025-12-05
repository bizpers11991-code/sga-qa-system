import React, { useState, useEffect, useMemo } from 'react';
import { TenderHandover, CrewResource, EquipmentResource } from '../../types';
import { resourcesApi } from '../../services/resourcesApi';
import { MultiSelect, MultiSelectOption } from '../ui/MultiSelect';

interface TenderHandoverFormProps {
  onSubmit: (data: Partial<TenderHandover>) => void;
  onCancel: () => void;
  initialData?: Partial<TenderHandover>;
}

interface ExtendedHandover extends Partial<TenderHandover> {
  assignedPersonnel?: string[];
  assignedEquipment?: string[];
}

const TenderHandoverForm: React.FC<TenderHandoverFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [crew, setCrew] = useState<CrewResource[]>([]);
  const [equipment, setEquipment] = useState<EquipmentResource[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);

  const [formData, setFormData] = useState<ExtendedHandover>(
    initialData || {
      clientName: '',
      clientTier: 'Tier 1',
      projectName: '',
      projectDescription: '',
      location: '',
      estimatedStartDate: '',
      estimatedEndDate: '',
      divisionsRequired: {
        asphalt: false,
        profiling: false,
        spray: false,
      },
      projectOwnerId: '',
      scopingPersonId: '',
      status: 'Draft',
      assignedPersonnel: [],
      assignedEquipment: [],
    }
  );

  // Load crew and equipment on mount
  useEffect(() => {
    const loadResources = async () => {
      try {
        const data = await resourcesApi.getResources();
        setCrew(data.crew);
        setEquipment(data.equipment);
      } catch (error) {
        console.error('Error loading resources:', error);
      } finally {
        setLoadingResources(false);
      }
    };
    loadResources();
  }, []);

  // Convert crew to MultiSelect options
  const personnelOptions: MultiSelectOption[] = useMemo(() =>
    crew.map(member => ({
      id: member.id,
      label: member.name,
      sublabel: member.isForeman ? 'Foreman' : member.role || 'Team Member',
      group: member.division,
    })), [crew]);

  // Filter equipment based on selected divisions
  const filteredEquipmentOptions: MultiSelectOption[] = useMemo(() => {
    const selectedDivisions: string[] = [];
    if (formData.divisionsRequired?.asphalt) selectedDivisions.push('Asphalt');
    if (formData.divisionsRequired?.profiling) selectedDivisions.push('Profiling');
    if (formData.divisionsRequired?.spray) selectedDivisions.push('Spray');

    return equipment
      .filter(eq => selectedDivisions.length === 0 || selectedDivisions.includes(eq.division) || eq.division === 'Common')
      .map(eq => ({
        id: eq.id,
        label: `${eq.id} - ${eq.name}`,
        sublabel: eq.type,
        group: eq.type,
      }));
  }, [equipment, formData.divisionsRequired]);

  const totalSteps = 5;

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDivisionChange = (division: 'asphalt' | 'profiling' | 'spray', checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      divisionsRequired: {
        ...prev.divisionsRequired!,
        [division]: checked,
      },
    }));
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return formData.clientName && formData.clientTier;
      case 2:
        return formData.projectName && formData.location && formData.estimatedStartDate && formData.estimatedEndDate;
      case 3:
        return formData.divisionsRequired && (
          formData.divisionsRequired.asphalt ||
          formData.divisionsRequired.profiling ||
          formData.divisionsRequired.spray
        );
      case 4:
        return formData.projectOwnerId && formData.scopingPersonId;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(totalSteps, prev + 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = () => {
    onSubmit({ ...formData, status: 'Submitted' });
  };

  const handleSaveDraft = () => {
    onSubmit({ ...formData, status: 'Draft' });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`flex items-center ${step < 5 ? 'flex-1' : ''}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step === currentStep
                    ? 'bg-sga-700 text-white'
                    : step < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step < currentStep ? '✓' : step}
              </div>
              {step < 5 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center text-sm text-gray-600 mt-2">
          Step {currentStep} of {totalSteps}
        </div>
      </div>

      {/* Step 1: Client Details */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Client Details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.clientName || ''}
              onChange={(e) => handleInputChange('clientName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent"
              placeholder="Enter client name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Tier <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.clientTier || 'Tier 1'}
              onChange={(e) => handleInputChange('clientTier', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent"
            >
              <option value="Tier 1">Tier 1</option>
              <option value="Tier 2">Tier 2</option>
              <option value="Tier 3">Tier 3</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contract Number
            </label>
            <input
              type="text"
              value={formData.contractNumber || ''}
              onChange={(e) => handleInputChange('contractNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Order Number
            </label>
            <input
              type="text"
              value={formData.purchaseOrderNumber || ''}
              onChange={(e) => handleInputChange('purchaseOrderNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent"
              placeholder="Optional"
            />
          </div>
        </div>
      )}

      {/* Step 2: Project Details */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.projectName || ''}
              onChange={(e) => handleInputChange('projectName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent"
              placeholder="Enter project name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Description
            </label>
            <textarea
              value={formData.projectDescription || ''}
              onChange={(e) => handleInputChange('projectDescription', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent"
              rows={3}
              placeholder="Describe the project"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent"
              placeholder="Enter location"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.estimatedStartDate || ''}
                onChange={(e) => handleInputChange('estimatedStartDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.estimatedEndDate || ''}
                onChange={(e) => handleInputChange('estimatedEndDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Technical Scope */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Technical Scope</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Divisions Required <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.divisionsRequired?.asphalt || false}
                  onChange={(e) => handleDivisionChange('asphalt', e.target.checked)}
                  className="w-5 h-5 text-sga-700 border-gray-300 rounded focus:ring-sga-700"
                />
                <span className="text-gray-700">Asphalt</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.divisionsRequired?.profiling || false}
                  onChange={(e) => handleDivisionChange('profiling', e.target.checked)}
                  className="w-5 h-5 text-sga-700 border-gray-300 rounded focus:ring-sga-700"
                />
                <span className="text-gray-700">Profiling</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.divisionsRequired?.spray || false}
                  onChange={(e) => handleDivisionChange('spray', e.target.checked)}
                  className="w-5 h-5 text-sga-700 border-gray-300 rounded focus:ring-sga-700"
                />
                <span className="text-gray-700">Spray</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Area (m²)
              </label>
              <input
                type="number"
                value={formData.estimatedArea || ''}
                onChange={(e) => handleInputChange('estimatedArea', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Thickness (mm)
              </label>
              <input
                type="number"
                value={formData.estimatedThickness || ''}
                onChange={(e) => handleInputChange('estimatedThickness', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent"
                placeholder="Optional"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Requirements
            </label>
            <textarea
              value={formData.specialRequirements || ''}
              onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent"
              rows={3}
              placeholder="Any special requirements or notes"
            />
          </div>
        </div>
      )}

      {/* Step 4: Assignment */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Assignment</h2>

          {loadingResources ? (
            <div className="text-center py-4 text-gray-500">Loading resources...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Owner (Engineer) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.projectOwnerId || ''}
                    onChange={(e) => handleInputChange('projectOwnerId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent"
                  >
                    <option value="">Select engineer...</option>
                    {crew
                      .filter(c => c.role?.toLowerCase().includes('engineer') || c.role?.toLowerCase().includes('superintendent') || c.role?.toLowerCase().includes('manager'))
                      .map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name} - {member.role || member.division}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Engineer who will plan and manage this project</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scoping Person <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.scopingPersonId || ''}
                    onChange={(e) => handleInputChange('scopingPersonId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent"
                  >
                    <option value="">Select scoping person...</option>
                    {crew
                      .filter(c =>
                        c.role?.toLowerCase().includes('engineer') ||
                        c.role?.toLowerCase().includes('foreman') ||
                        c.role?.toLowerCase().includes('superintendent')
                      )
                      .map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name} - {member.role || (member.isForeman ? 'Foreman' : member.division)}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Engineer, Foreman, or Superintendent for site scoping</p>
                </div>
              </div>

              <div>
                <MultiSelect
                  label="Assign Team Members"
                  placeholder="Select team members for this project..."
                  options={personnelOptions}
                  selected={formData.assignedPersonnel || []}
                  onChange={(selected) => handleInputChange('assignedPersonnel', selected)}
                  searchable={true}
                  groupBy={true}
                  showSelectAll={true}
                  maxHeight={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select crew members who will be working on this project
                </p>
              </div>

              <div>
                <MultiSelect
                  label="Reserve Equipment"
                  placeholder="Select equipment to reserve..."
                  options={filteredEquipmentOptions}
                  selected={formData.assignedEquipment || []}
                  onChange={(selected) => handleInputChange('assignedEquipment', selected)}
                  searchable={true}
                  groupBy={true}
                  showSelectAll={false}
                  maxHeight={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Pre-allocate equipment based on selected divisions
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 5: Review & Submit */}
      {currentStep === 5 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Review & Submit</h2>
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Client</h3>
                <p className="text-gray-900">{formData.clientName} ({formData.clientTier})</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Timeline</h3>
                <p className="text-gray-900">
                  {formData.estimatedStartDate} to {formData.estimatedEndDate}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Project</h3>
              <p className="text-gray-900">{formData.projectName}</p>
              <p className="text-sm text-gray-600">{formData.location}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Divisions</h3>
              <div className="flex gap-2">
                {formData.divisionsRequired?.asphalt && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Asphalt</span>
                )}
                {formData.divisionsRequired?.profiling && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Profiling</span>
                )}
                {formData.divisionsRequired?.spray && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Spray</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Project Owner</h3>
                <p className="text-gray-900">
                  {crew.find(c => c.id === formData.projectOwnerId)?.name || formData.projectOwnerId || 'Not assigned'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Scoping Person</h3>
                <p className="text-gray-900">
                  {crew.find(c => c.id === formData.scopingPersonId)?.name || formData.scopingPersonId || 'Not assigned'}
                </p>
              </div>
            </div>
            {(formData.assignedPersonnel?.length || 0) > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Assigned Team ({formData.assignedPersonnel?.length})</h3>
                <div className="flex flex-wrap gap-1">
                  {formData.assignedPersonnel?.map(id => {
                    const member = crew.find(c => c.id === id);
                    return member ? (
                      <span key={id} className="px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded">
                        {member.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
            {(formData.assignedEquipment?.length || 0) > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Reserved Equipment ({formData.assignedEquipment?.length})</h3>
                <div className="flex flex-wrap gap-1">
                  {formData.assignedEquipment?.map(id => {
                    const eq = equipment.find(e => e.id === id);
                    return eq ? (
                      <span key={id} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                        {eq.id} - {eq.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Cancel
        </button>
        <div className="flex gap-3">
          {currentStep > 1 && (
            <button
              onClick={handlePrevious}
              className="px-4 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Previous
            </button>
          )}
          {currentStep === totalSteps && (
            <button
              onClick={handleSaveDraft}
              className="px-4 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Save Draft
            </button>
          )}
          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={!validateStep()}
              className="px-4 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Submit Handover
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenderHandoverForm;
