import React, { useState, useEffect } from 'react';
import { CreateJobRequest } from '../../services/jobsApi';
import { SecureForeman, CrewResource, EquipmentResource, ItpChecklistData, JobEquipment, JobTruck, JobMaterialRow } from '../../types';
import { resourcesApi } from '../../services/resourcesApi';
import { itpApi } from '../../services/itpApi';

interface JobFormWizardProps {
  onSubmit: (data: CreateJobRequest) => Promise<void>;
  initialData?: Partial<CreateJobRequest>;
  foremen: SecureForeman[];
  isLoading?: boolean;
}

type WizardStep = 1 | 2 | 3 | 4;

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
    itpTemplateId: '',
    area: undefined,
    thickness: undefined,
    qaSpec: '',
    profilingDetails: {
      dateRequired: '',
      crewLeader: '',
      crew: [],
      depotStartTime: '',
      leaveDepotTime: '',
      onSiteBriefingTime: '',
      startCutTime: '',
      clientSiteContact: '',
      mapLink: '',
      workArea: undefined,
      workDepth: undefined,
      tons: undefined,
      trucksCount: undefined,
      descriptionOfWorks: '',
      rapDumpsite: '',
      equipment: [],
      trucks: [],
    },
    asphaltDetails: {
      asphaltPlant: '',
      startTimeYard: '',
      estimatedFinishTime: '',
      mapLink: '',
      dayShift: false,
      contacts: {
        projectManager: '',
        projectSupervisor: '',
        asphaltSupervisor: '',
        asphaltForeman: '',
        clientEngineer: { name: '', phone: '' },
        clientSupervisor: { name: '', phone: '' },
      },
      siteDetails: {
        plantLaydownLocation: '',
        inspectedBy: '',
        compactionCheck: '',
        surfaceCondition: '',
        trafficControl: '',
        sweeping: '',
        inductions: '',
      },
      cartage: {
        semiTrucks: undefined,
        eightWheelTrucks: undefined,
        tanddTrucks: undefined,
        sixWheelTrucks: undefined,
        lilTipper: undefined,
      },
      materials: [],
    },
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [crew, setCrew] = useState<CrewResource[]>([]);
  const [equipment, setEquipment] = useState<EquipmentResource[]>([]);
  const [itpTemplates, setItpTemplates] = useState<ItpChecklistData[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);

  // Load resources and ITP templates on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingResources(true);
        const [resourcesData, templatesData] = await Promise.all([
          resourcesApi.getResources(),
          itpApi.getItpTemplates(),
        ]);
        setCrew(resourcesData.crew);
        setEquipment(resourcesData.equipment);
        setItpTemplates(templatesData);
      } catch (error) {
        console.error('Error loading resources:', error);
      } finally {
        setLoadingResources(false);
      }
    };
    loadData();
  }, []);

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

  // Filter crew by division
  const filteredCrew = formData.division
    ? resourcesApi.filterCrewByDivision(crew, formData.division)
    : crew;

  // Filter crew leaders by division
  const crewLeaders = formData.division
    ? resourcesApi.getCrewLeaders(crew, formData.division)
    : crew.filter((c) => c.isForeman);

  // Filter equipment by division
  const filteredEquipment = formData.division
    ? resourcesApi.filterEquipmentByDivision(equipment, formData.division)
    : equipment;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    // Handle nested paths (e.g., "profilingDetails.crewLeader")
    if (name.includes('.')) {
      const parts = name.split('.');
      setFormData((prev) => {
        const newData = { ...prev };
        let current: any = newData;
        for (let i = 0; i < parts.length - 1; i++) {
          current[parts[i]] = { ...current[parts[i]] };
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = type === 'checkbox' ? checked : value;
        return newData;
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCrewSelect = (crewId: string) => {
    setFormData((prev) => {
      const currentCrew = prev.profilingDetails?.crew || [];
      const newCrew = currentCrew.includes(crewId)
        ? currentCrew.filter((id) => id !== crewId)
        : [...currentCrew, crewId];
      return {
        ...prev,
        profilingDetails: {
          ...prev.profilingDetails,
          crew: newCrew,
        },
      };
    });
  };

  const addEquipment = () => {
    setFormData((prev) => ({
      ...prev,
      profilingDetails: {
        ...prev.profilingDetails,
        equipment: [
          ...(prev.profilingDetails?.equipment || []),
          { machine: '', startTime: '', supplier: 'SGA', notes: '' },
        ],
      },
    }));
  };

  const removeEquipment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      profilingDetails: {
        ...prev.profilingDetails,
        equipment: (prev.profilingDetails?.equipment || []).filter((_, i) => i !== index),
      },
    }));
  };

  const updateEquipment = (index: number, field: keyof JobEquipment, value: string) => {
    setFormData((prev) => {
      const equipment = [...(prev.profilingDetails?.equipment || [])];
      equipment[index] = { ...equipment[index], [field]: value };
      return {
        ...prev,
        profilingDetails: {
          ...prev.profilingDetails,
          equipment,
        },
      };
    });
  };

  const addTruck = () => {
    setFormData((prev) => ({
      ...prev,
      profilingDetails: {
        ...prev.profilingDetails,
        trucks: [...(prev.profilingDetails?.trucks || []), { truckId: '' }],
      },
    }));
  };

  const removeTruck = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      profilingDetails: {
        ...prev.profilingDetails,
        trucks: (prev.profilingDetails?.trucks || []).filter((_, i) => i !== index),
      },
    }));
  };

  const updateTruck = (index: number, truckId: string) => {
    setFormData((prev) => {
      const trucks = [...(prev.profilingDetails?.trucks || [])];
      trucks[index] = { truckId };
      return {
        ...prev,
        profilingDetails: {
          ...prev.profilingDetails,
          trucks,
        },
      };
    });
  };

  const addMaterial = () => {
    setFormData((prev) => ({
      ...prev,
      asphaltDetails: {
        ...prev.asphaltDetails,
        materials: [
          ...(prev.asphaltDetails?.materials || []),
          {
            mixCode: '',
            pavementType: 'Base',
            tonnes: 0,
            area: 0,
            depth: 40,
            density: 2.4,
            lotNumber: '',
          },
        ],
      },
    }));
  };

  const removeMaterial = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      asphaltDetails: {
        ...prev.asphaltDetails,
        materials: (prev.asphaltDetails?.materials || []).filter((_, i) => i !== index),
      },
    }));
  };

  const updateMaterial = (index: number, field: keyof JobMaterialRow, value: string | number) => {
    setFormData((prev) => {
      const materials = [...(prev.asphaltDetails?.materials || [])];
      materials[index] = { ...materials[index], [field]: value };
      return {
        ...prev,
        asphaltDetails: {
          ...prev.asphaltDetails,
          materials,
        },
      };
    });
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
      if (!formData.foremanId) {
        newErrors.foremanId = 'Foreman is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(4, prev + 1) as WizardStep);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1) as WizardStep);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all steps
    if (!validateStep(1)) {
      setCurrentStep(1);
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
      itpTemplateId: formData.itpTemplateId,
    };

    // Add division-specific details
    if (formData.division === 'Profiling' && formData.profilingDetails) {
      jobData.profilingDetails = formData.profilingDetails;
    } else if (formData.division === 'Asphalt' && formData.asphaltDetails) {
      jobData.asphaltDetails = formData.asphaltDetails;
    }

    await onSubmit(jobData);
  };

  const renderProgressIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4].map((step) => (
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
                {step === 1
                  ? 'Basic Info'
                  : step === 2
                  ? 'Job Details'
                  : step === 3
                  ? 'Materials'
                  : 'Review'}
              </span>
            </div>
            {step < 4 && (
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
          Location / Address <span className="text-red-500">*</span>
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
            Date of Job <span className="text-red-500">*</span>
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
            QA Due Date <span className="text-red-500">*</span>
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
          <label htmlFor="foremanId" className="block text-sm font-medium text-gray-700 mb-1">
            Foreman <span className="text-red-500">*</span>
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
                  {foreman.name}
                </option>
              ))
            )}
          </select>
          {errors.foremanId && <p className="mt-1 text-sm text-red-600">{errors.foremanId}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="itpTemplateId" className="block text-sm font-medium text-gray-700 mb-1">
          ITP Template
        </label>
        <select
          id="itpTemplateId"
          name="itpTemplateId"
          value={formData.itpTemplateId || ''}
          onChange={handleInputChange}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500 transition-colors"
        >
          <option value="">Select Template...</option>
          <option value="default">Default ITP</option>
          {itpTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name || template.id}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderProfilingJobDetails = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-sga-700 border-b border-gray-200 pb-2">
        Job Header & Attachments
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="profilingDetails.dateRequired" className="block text-sm font-medium text-gray-700 mb-1">
            Date Required
          </label>
          <input
            type="date"
            id="profilingDetails.dateRequired"
            name="profilingDetails.dateRequired"
            value={formData.profilingDetails?.dateRequired || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
          />
        </div>

        <div>
          <label htmlFor="profilingDetails.crewLeader" className="block text-sm font-medium text-gray-700 mb-1">
            Crew Leader
          </label>
          <select
            id="profilingDetails.crewLeader"
            name="profilingDetails.crewLeader"
            value={formData.profilingDetails?.crewLeader || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
          >
            <option value="">Select crew leader...</option>
            {crewLeaders.map((leader) => (
              <option key={leader.id} value={leader.id}>
                {leader.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Crew (Multi-select)</label>
        <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
          {filteredCrew.map((member) => (
            <label key={member.id} className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.profilingDetails?.crew?.includes(member.id) || false}
                onChange={() => handleCrewSelect(member.id)}
                className="rounded text-sga-700 focus:ring-sga-500"
              />
              <span className="text-sm text-gray-900">{member.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="profilingDetails.depotStartTime" className="block text-sm font-medium text-gray-700 mb-1">
            Depot Start Time
          </label>
          <input
            type="time"
            id="profilingDetails.depotStartTime"
            name="profilingDetails.depotStartTime"
            value={formData.profilingDetails?.depotStartTime || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
          />
        </div>

        <div>
          <label htmlFor="profilingDetails.leaveDepotTime" className="block text-sm font-medium text-gray-700 mb-1">
            Leave Depot Time
          </label>
          <input
            type="time"
            id="profilingDetails.leaveDepotTime"
            name="profilingDetails.leaveDepotTime"
            value={formData.profilingDetails?.leaveDepotTime || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
          />
        </div>

        <div>
          <label htmlFor="profilingDetails.onSiteBriefingTime" className="block text-sm font-medium text-gray-700 mb-1">
            On Site Briefing
          </label>
          <input
            type="time"
            id="profilingDetails.onSiteBriefingTime"
            name="profilingDetails.onSiteBriefingTime"
            value={formData.profilingDetails?.onSiteBriefingTime || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
          />
        </div>

        <div>
          <label htmlFor="profilingDetails.startCutTime" className="block text-sm font-medium text-gray-700 mb-1">
            Start Cut Time
          </label>
          <input
            type="time"
            id="profilingDetails.startCutTime"
            name="profilingDetails.startCutTime"
            value={formData.profilingDetails?.startCutTime || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="profilingDetails.clientSiteContact" className="block text-sm font-medium text-gray-700 mb-1">
            Client Site Contact
          </label>
          <input
            type="text"
            id="profilingDetails.clientSiteContact"
            name="profilingDetails.clientSiteContact"
            value={formData.profilingDetails?.clientSiteContact || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
            placeholder="Name and phone"
          />
        </div>

        <div>
          <label htmlFor="profilingDetails.mapLink" className="block text-sm font-medium text-gray-700 mb-1">
            Map Link
          </label>
          <input
            type="url"
            id="profilingDetails.mapLink"
            name="profilingDetails.mapLink"
            value={formData.profilingDetails?.mapLink || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
            placeholder="https://maps.google.com/..."
          />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-sga-700 border-b border-gray-200 pb-2 mt-8">
        Description of Works
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="profilingDetails.workArea" className="block text-sm font-medium text-gray-700 mb-1">
            Area (m²)
          </label>
          <input
            type="number"
            id="profilingDetails.workArea"
            name="profilingDetails.workArea"
            value={formData.profilingDetails?.workArea || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
            min="0"
          />
        </div>

        <div>
          <label htmlFor="profilingDetails.workDepth" className="block text-sm font-medium text-gray-700 mb-1">
            Depth (mm)
          </label>
          <input
            type="number"
            id="profilingDetails.workDepth"
            name="profilingDetails.workDepth"
            value={formData.profilingDetails?.workDepth || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
            min="0"
          />
        </div>

        <div>
          <label htmlFor="profilingDetails.tons" className="block text-sm font-medium text-gray-700 mb-1">
            Tons
          </label>
          <input
            type="number"
            id="profilingDetails.tons"
            name="profilingDetails.tons"
            value={formData.profilingDetails?.tons || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
            min="0"
          />
        </div>

        <div>
          <label htmlFor="profilingDetails.trucksCount" className="block text-sm font-medium text-gray-700 mb-1">
            Trucks
          </label>
          <input
            type="number"
            id="profilingDetails.trucksCount"
            name="profilingDetails.trucksCount"
            value={formData.profilingDetails?.trucksCount || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
            min="0"
          />
        </div>
      </div>

      <div>
        <label htmlFor="profilingDetails.descriptionOfWorks" className="block text-sm font-medium text-gray-700 mb-1">
          Description of Works
        </label>
        <textarea
          id="profilingDetails.descriptionOfWorks"
          name="profilingDetails.descriptionOfWorks"
          value={formData.profilingDetails?.descriptionOfWorks || ''}
          onChange={handleInputChange}
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
          placeholder="Detailed description of the work to be performed..."
        />
      </div>

      <div>
        <label htmlFor="profilingDetails.rapDumpsite" className="block text-sm font-medium text-gray-700 mb-1">
          RAP Dumpsite
        </label>
        <input
          type="text"
          id="profilingDetails.rapDumpsite"
          name="profilingDetails.rapDumpsite"
          value={formData.profilingDetails?.rapDumpsite || ''}
          onChange={handleInputChange}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
          placeholder="Location of RAP dumpsite"
        />
      </div>

      <h3 className="text-lg font-semibold text-sga-700 border-b border-gray-200 pb-2 mt-8">
        Plant Requirements - Profilers & Equipment
      </h3>

      <div className="space-y-3">
        {(formData.profilingDetails?.equipment || []).map((equip, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Machine</label>
              <select
                value={equip.machine}
                onChange={(e) => updateEquipment(index, 'machine', e.target.value)}
                className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-sga-500"
              >
                <option value="">Select...</option>
                {filteredEquipment.map((eq) => (
                  <option key={eq.id} value={`${eq.name} (${eq.id})`}>
                    {eq.name} ({eq.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={equip.startTime}
                onChange={(e) => updateEquipment(index, 'startTime', e.target.value)}
                className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-sga-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Supplier</label>
              <input
                type="text"
                value={equip.supplier}
                onChange={(e) => updateEquipment(index, 'supplier', e.target.value)}
                className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-sga-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                value={equip.notes}
                onChange={(e) => updateEquipment(index, 'notes', e.target.value)}
                className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-sga-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => removeEquipment(index)}
                className="w-full px-3 py-1.5 text-sm text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addEquipment}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Equipment
        </button>
      </div>

      <h3 className="text-lg font-semibold text-sga-700 border-b border-gray-200 pb-2 mt-8">
        Trucks
      </h3>

      <div className="space-y-3">
        {(formData.profilingDetails?.trucks || []).map((truck, index) => (
          <div key={index} className="flex gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Truck ID</label>
              <input
                type="text"
                value={truck.truckId}
                onChange={(e) => updateTruck(index, e.target.value)}
                className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-sga-500"
                placeholder="e.g., TRUCK-001"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => removeTruck(index)}
                className="px-3 py-1.5 text-sm text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addTruck}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Truck
        </button>
      </div>
    </div>
  );

  const renderAsphaltJobDetails = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-sga-700 border-b border-gray-200 pb-2">
        Job Header
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="asphaltDetails.asphaltPlant" className="block text-sm font-medium text-gray-700 mb-1">
            Asphalt Plant
          </label>
          <input
            type="text"
            id="asphaltDetails.asphaltPlant"
            name="asphaltDetails.asphaltPlant"
            value={formData.asphaltDetails?.asphaltPlant || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
            placeholder="Plant name"
          />
        </div>

        <div>
          <label htmlFor="asphaltDetails.mapLink" className="block text-sm font-medium text-gray-700 mb-1">
            Map Link
          </label>
          <input
            type="url"
            id="asphaltDetails.mapLink"
            name="asphaltDetails.mapLink"
            value={formData.asphaltDetails?.mapLink || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
            placeholder="https://maps.google.com/..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="asphaltDetails.startTimeYard" className="block text-sm font-medium text-gray-700 mb-1">
            Start Time (Yard)
          </label>
          <input
            type="time"
            id="asphaltDetails.startTimeYard"
            name="asphaltDetails.startTimeYard"
            value={formData.asphaltDetails?.startTimeYard || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
          />
        </div>

        <div>
          <label htmlFor="asphaltDetails.estimatedFinishTime" className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Finish Time
          </label>
          <input
            type="time"
            id="asphaltDetails.estimatedFinishTime"
            name="asphaltDetails.estimatedFinishTime"
            value={formData.asphaltDetails?.estimatedFinishTime || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
          />
        </div>

        <div className="flex items-center pt-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              id="asphaltDetails.dayShift"
              name="asphaltDetails.dayShift"
              checked={formData.asphaltDetails?.dayShift || false}
              onChange={handleInputChange}
              className="rounded text-sga-700 focus:ring-sga-500"
            />
            <span className="text-sm font-medium text-gray-700">Day Shift</span>
          </label>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-sga-700 border-b border-gray-200 pb-2 mt-8">
        Contacts
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="asphaltDetails.contacts.projectManager" className="block text-sm font-medium text-gray-700 mb-1">
            Project Manager
          </label>
          <input
            type="text"
            id="asphaltDetails.contacts.projectManager"
            name="asphaltDetails.contacts.projectManager"
            value={formData.asphaltDetails?.contacts?.projectManager || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
          />
        </div>

        <div>
          <label htmlFor="asphaltDetails.contacts.projectSupervisor" className="block text-sm font-medium text-gray-700 mb-1">
            Project Supervisor
          </label>
          <input
            type="text"
            id="asphaltDetails.contacts.projectSupervisor"
            name="asphaltDetails.contacts.projectSupervisor"
            value={formData.asphaltDetails?.contacts?.projectSupervisor || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
          />
        </div>

        <div>
          <label htmlFor="asphaltDetails.contacts.asphaltSupervisor" className="block text-sm font-medium text-gray-700 mb-1">
            Asphalt Supervisor
          </label>
          <input
            type="text"
            id="asphaltDetails.contacts.asphaltSupervisor"
            name="asphaltDetails.contacts.asphaltSupervisor"
            value={formData.asphaltDetails?.contacts?.asphaltSupervisor || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
          />
        </div>

        <div>
          <label htmlFor="asphaltDetails.contacts.asphaltForeman" className="block text-sm font-medium text-gray-700 mb-1">
            Asphalt Foreman
          </label>
          <input
            type="text"
            id="asphaltDetails.contacts.asphaltForeman"
            name="asphaltDetails.contacts.asphaltForeman"
            value={formData.asphaltDetails?.contacts?.asphaltForeman || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="asphaltDetails.contacts.clientEngineer.name" className="block text-sm font-medium text-gray-700 mb-1">
            Client Engineer Name
          </label>
          <input
            type="text"
            id="asphaltDetails.contacts.clientEngineer.name"
            name="asphaltDetails.contacts.clientEngineer.name"
            value={formData.asphaltDetails?.contacts?.clientEngineer?.name || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
          />
        </div>

        <div>
          <label htmlFor="asphaltDetails.contacts.clientEngineer.phone" className="block text-sm font-medium text-gray-700 mb-1">
            Client Engineer Phone
          </label>
          <input
            type="tel"
            id="asphaltDetails.contacts.clientEngineer.phone"
            name="asphaltDetails.contacts.clientEngineer.phone"
            value={formData.asphaltDetails?.contacts?.clientEngineer?.phone || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
          />
        </div>

        <div>
          <label htmlFor="asphaltDetails.contacts.clientSupervisor.name" className="block text-sm font-medium text-gray-700 mb-1">
            Client Supervisor Name
          </label>
          <input
            type="text"
            id="asphaltDetails.contacts.clientSupervisor.name"
            name="asphaltDetails.contacts.clientSupervisor.name"
            value={formData.asphaltDetails?.contacts?.clientSupervisor?.name || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
          />
        </div>

        <div>
          <label htmlFor="asphaltDetails.contacts.clientSupervisor.phone" className="block text-sm font-medium text-gray-700 mb-1">
            Client Supervisor Phone
          </label>
          <input
            type="tel"
            id="asphaltDetails.contacts.clientSupervisor.phone"
            name="asphaltDetails.contacts.clientSupervisor.phone"
            value={formData.asphaltDetails?.contacts?.clientSupervisor?.phone || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
          />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-sga-700 border-b border-gray-200 pb-2 mt-8">
        Site Details
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="asphaltDetails.siteDetails.plantLaydownLocation" className="block text-sm font-medium text-gray-700 mb-1">
            Plant Laydown Location
          </label>
          <input
            type="text"
            id="asphaltDetails.siteDetails.plantLaydownLocation"
            name="asphaltDetails.siteDetails.plantLaydownLocation"
            value={formData.asphaltDetails?.siteDetails?.plantLaydownLocation || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
          />
        </div>

        <div>
          <label htmlFor="asphaltDetails.siteDetails.inspectedBy" className="block text-sm font-medium text-gray-700 mb-1">
            Inspected By
          </label>
          <input
            type="text"
            id="asphaltDetails.siteDetails.inspectedBy"
            name="asphaltDetails.siteDetails.inspectedBy"
            value={formData.asphaltDetails?.siteDetails?.inspectedBy || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
          />
        </div>

        <div>
          <label htmlFor="asphaltDetails.siteDetails.compactionCheck" className="block text-sm font-medium text-gray-700 mb-1">
            Compaction Check
          </label>
          <input
            type="text"
            id="asphaltDetails.siteDetails.compactionCheck"
            name="asphaltDetails.siteDetails.compactionCheck"
            value={formData.asphaltDetails?.siteDetails?.compactionCheck || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
          />
        </div>

        <div>
          <label htmlFor="asphaltDetails.siteDetails.surfaceCondition" className="block text-sm font-medium text-gray-700 mb-1">
            Surface & Condition
          </label>
          <input
            type="text"
            id="asphaltDetails.siteDetails.surfaceCondition"
            name="asphaltDetails.siteDetails.surfaceCondition"
            value={formData.asphaltDetails?.siteDetails?.surfaceCondition || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
          />
        </div>

        <div>
          <label htmlFor="asphaltDetails.siteDetails.trafficControl" className="block text-sm font-medium text-gray-700 mb-1">
            Traffic Control
          </label>
          <input
            type="text"
            id="asphaltDetails.siteDetails.trafficControl"
            name="asphaltDetails.siteDetails.trafficControl"
            value={formData.asphaltDetails?.siteDetails?.trafficControl || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
          />
        </div>

        <div>
          <label htmlFor="asphaltDetails.siteDetails.sweeping" className="block text-sm font-medium text-gray-700 mb-1">
            Sweeping
          </label>
          <input
            type="text"
            id="asphaltDetails.siteDetails.sweeping"
            name="asphaltDetails.siteDetails.sweeping"
            value={formData.asphaltDetails?.siteDetails?.sweeping || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="asphaltDetails.siteDetails.inductions" className="block text-sm font-medium text-gray-700 mb-1">
          Inductions
        </label>
        <textarea
          id="asphaltDetails.siteDetails.inductions"
          name="asphaltDetails.siteDetails.inductions"
          value={formData.asphaltDetails?.siteDetails?.inductions || ''}
          onChange={handleInputChange}
          rows={2}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
          placeholder="Induction requirements..."
        />
      </div>

      <h3 className="text-lg font-semibold text-sga-700 border-b border-gray-200 pb-2 mt-8">
        Cartage
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <label htmlFor="asphaltDetails.cartage.semiTrucks" className="block text-sm font-medium text-gray-700 mb-1">
            SEMI Trucks
          </label>
          <input
            type="number"
            id="asphaltDetails.cartage.semiTrucks"
            name="asphaltDetails.cartage.semiTrucks"
            value={formData.asphaltDetails?.cartage?.semiTrucks || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
            min="0"
          />
        </div>

        <div>
          <label htmlFor="asphaltDetails.cartage.eightWheelTrucks" className="block text-sm font-medium text-gray-700 mb-1">
            8W Trucks
          </label>
          <input
            type="number"
            id="asphaltDetails.cartage.eightWheelTrucks"
            name="asphaltDetails.cartage.eightWheelTrucks"
            value={formData.asphaltDetails?.cartage?.eightWheelTrucks || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
            min="0"
          />
        </div>

        <div>
          <label htmlFor="asphaltDetails.cartage.tanddTrucks" className="block text-sm font-medium text-gray-700 mb-1">
            T&D Trucks
          </label>
          <input
            type="number"
            id="asphaltDetails.cartage.tanddTrucks"
            name="asphaltDetails.cartage.tanddTrucks"
            value={formData.asphaltDetails?.cartage?.tanddTrucks || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
            min="0"
          />
        </div>

        <div>
          <label htmlFor="asphaltDetails.cartage.sixWheelTrucks" className="block text-sm font-medium text-gray-700 mb-1">
            6W Trucks
          </label>
          <input
            type="number"
            id="asphaltDetails.cartage.sixWheelTrucks"
            name="asphaltDetails.cartage.sixWheelTrucks"
            value={formData.asphaltDetails?.cartage?.sixWheelTrucks || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
            min="0"
          />
        </div>

        <div>
          <label htmlFor="asphaltDetails.cartage.lilTipper" className="block text-sm font-medium text-gray-700 mb-1">
            Lil Tipper
          </label>
          <input
            type="number"
            id="asphaltDetails.cartage.lilTipper"
            name="asphaltDetails.cartage.lilTipper"
            value={formData.asphaltDetails?.cartage?.lilTipper || ''}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
            min="0"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Sheet Details</h2>

      {formData.division === 'Profiling' && renderProfilingJobDetails()}
      {formData.division === 'Asphalt' && renderAsphaltJobDetails()}
      {formData.division === 'Spray' && (
        <div className="text-center py-8 text-gray-500">
          <p>Basic job information is sufficient for Spray jobs.</p>
          <p className="text-sm mt-2">Click Next to proceed to review.</p>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => {
    if (formData.division !== 'Asphalt') {
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Materials</h2>
          <div className="text-center py-8 text-gray-500">
            <p>Material tracking is only required for Asphalt jobs.</p>
            <p className="text-sm mt-2">Click Next to proceed to review.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Job & Materials</h2>

        <div className="space-y-3">
          {(formData.asphaltDetails?.materials || []).map((material, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mix Code</label>
                  <select
                    value={material.mixCode}
                    onChange={(e) => updateMaterial(index, 'mixCode', e.target.value)}
                    className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-sga-500"
                  >
                    <option value="">Select...</option>
                    <option value="AC10">AC10</option>
                    <option value="AC14">AC14</option>
                    <option value="AC20">AC20</option>
                    <option value="SMA10">SMA10</option>
                    <option value="SMA14">SMA14</option>
                    <option value="DGB20">DGB20</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Pavement Type</label>
                  <select
                    value={material.pavementType}
                    onChange={(e) => updateMaterial(index, 'pavementType', e.target.value)}
                    className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-sga-500"
                  >
                    <option value="Base">Base</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Wearing Course">Wearing Course</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Lot #</label>
                  <input
                    type="text"
                    value={material.lotNumber}
                    onChange={(e) => updateMaterial(index, 'lotNumber', e.target.value)}
                    className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-sga-500"
                    placeholder="e.g., LOT-2024-001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tonnes</label>
                  <input
                    type="number"
                    value={material.tonnes}
                    onChange={(e) => updateMaterial(index, 'tonnes', parseFloat(e.target.value) || 0)}
                    className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-sga-500"
                    min="0"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Area (m²)</label>
                  <input
                    type="number"
                    value={material.area}
                    onChange={(e) => updateMaterial(index, 'area', parseFloat(e.target.value) || 0)}
                    className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-sga-500"
                    min="0"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Depth (mm)</label>
                  <input
                    type="number"
                    value={material.depth}
                    onChange={(e) => updateMaterial(index, 'depth', parseFloat(e.target.value) || 0)}
                    className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-sga-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Density</label>
                  <input
                    type="number"
                    value={material.density}
                    onChange={(e) => updateMaterial(index, 'density', parseFloat(e.target.value) || 0)}
                    className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-sga-500"
                    min="0"
                    step="0.1"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeMaterial(index)}
                    className="w-full px-3 py-1.5 text-sm text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addMaterial}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Material
          </button>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    const selectedForeman = filteredForemen.find((f) => f.id === formData.foremanId);
    const selectedCrewLeader = crewLeaders.find((c) => c.id === formData.profilingDetails?.crewLeader);
    const selectedCrewMembers = filteredCrew.filter((c) =>
      formData.profilingDetails?.crew?.includes(c.id)
    );

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Review & Create Job</h2>

        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
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
            <div>
              <dt className="text-gray-600">QA Due Date:</dt>
              <dd className="font-medium text-gray-900">
                {formData.dueDate
                  ? new Date(formData.dueDate).toLocaleDateString('en-AU')
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600">Foreman:</dt>
              <dd className="font-medium text-gray-900">{selectedForeman?.name || '-'}</dd>
            </div>
          </dl>
        </div>

        {formData.division === 'Profiling' && formData.profilingDetails && (
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Profiling Details</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-600">Crew Leader:</dt>
                <dd className="font-medium text-gray-900">{selectedCrewLeader?.name || '-'}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Crew Members:</dt>
                <dd className="font-medium text-gray-900">
                  {selectedCrewMembers.length > 0
                    ? selectedCrewMembers.map((c) => c.name).join(', ')
                    : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-600">Work Area:</dt>
                <dd className="font-medium text-gray-900">
                  {formData.profilingDetails.workArea
                    ? `${formData.profilingDetails.workArea} m²`
                    : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-600">Equipment Count:</dt>
                <dd className="font-medium text-gray-900">
                  {formData.profilingDetails.equipment?.length || 0} items
                </dd>
              </div>
            </dl>
          </div>
        )}

        {formData.division === 'Asphalt' && formData.asphaltDetails && (
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Asphalt Details</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-600">Asphalt Plant:</dt>
                <dd className="font-medium text-gray-900">
                  {formData.asphaltDetails.asphaltPlant || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-600">Project Manager:</dt>
                <dd className="font-medium text-gray-900">
                  {formData.asphaltDetails.contacts?.projectManager || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-600">Materials Count:</dt>
                <dd className="font-medium text-gray-900">
                  {formData.asphaltDetails.materials?.length || 0} materials
                </dd>
              </div>
              <div>
                <dt className="text-gray-600">Day Shift:</dt>
                <dd className="font-medium text-gray-900">
                  {formData.asphaltDetails.dayShift ? 'Yes' : 'No'}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    );
  };

  if (loadingResources) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sga-700 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading resources...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
      {renderProgressIndicator()}

      <div className="bg-white rounded-lg shadow p-6 mb-6 max-h-[70vh] overflow-y-auto">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
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

        {currentStep < 4 ? (
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
            {isLoading ? 'Creating Job...' : 'Save Job'}
          </button>
        )}
      </div>
    </form>
  );
};

export default JobFormWizard;
