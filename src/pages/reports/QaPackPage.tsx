import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import {
  Job,
  QaPack,
  SgaDailyReportData,
  SiteRecordData,
  ItpChecklistData,
  AsphaltPlacementData,
  StraightEdgeData,
  SitePhoto,
  CrewResource,
  EquipmentResource,
} from '../../types';
import { PageContainer, PageHeader } from '../../components/layout';
import QaPackTabs, { TabConfig } from '../../components/reports/QaPackTabs';
import JobSheetDisplay from '../../components/reports/JobSheetDisplay';
import DailyReportForm from '../../components/reports/DailyReportForm';
import SiteRecordForm from '../../components/reports/SiteRecordForm';
import ItpChecklistForm from '../../components/reports/ItpChecklistForm';
import AsphaltPlacementForm from '../../components/reports/AsphaltPlacementForm';
import StraightEdgeForm from '../../components/reports/StraightEdgeForm';
import SitePhotosForm from '../../components/reports/SitePhotosForm';
import SignaturePad from '../../components/common/SignaturePad';
import { resourcesApi } from '../../services/resourcesApi';
import { itpApi } from '../../services/itpApi';
import { Save, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';

export const QaPackPage: React.FC = () => {
  const { id: jobId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accounts } = useMsal();
  const user = accounts[0];

  // State
  const [job, setJob] = useState<Job | null>(null);
  const [qaPack, setQaPack] = useState<Partial<QaPack> | null>(null);
  const [activeTab, setActiveTab] = useState<string>('jobSheet');
  const [isGuidedMode, setIsGuidedMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [crewResources, setCrewResources] = useState<CrewResource[]>([]);
  const [equipmentResources, setEquipmentResources] = useState<EquipmentResource[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const foremanSignatureRef = useRef<{ toDataURL: () => string; clear: () => void }>(null);

  // Auto-save interval ref
  const autoSaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load job data and resources
  useEffect(() => {
    const loadData = async () => {
      if (!jobId) return;

      setIsLoading(true);
      try {
        // Fetch job data (mock for now - replace with real API)
        const mockJob: Job = {
          id: jobId,
          jobNo: 'J-2024-001',
          client: 'Test Client',
          division: 'Asphalt',
          projectName: 'Test Project',
          location: '123 Test Street',
          foremanId: user?.localAccountId || '',
          jobDate: new Date().toISOString().split('T')[0],
          dueDate: new Date().toISOString().split('T')[0],
          qaSpec: 'AS3600-2018',
          itpTemplateId: 'template-001',
        };

        setJob(mockJob);

        // Fetch resources
        const resources = await resourcesApi.getResources();
        setCrewResources(resources.crew);
        setEquipmentResources(resources.equipment);

        // Load ITP template if specified
        let itpChecklist: ItpChecklistData = { sections: [] };
        if (mockJob.itpTemplateId) {
          try {
            itpChecklist = await itpApi.getItpTemplate(mockJob.itpTemplateId);
          } catch (error) {
            console.error('Failed to load ITP template:', error);
          }
        }

        // Initialize QA Pack with empty data
        const initialQaPack: Partial<QaPack> = {
          sgaDailyReport: {
            project: mockJob.projectName,
            date: mockJob.jobDate,
            completedBy: user?.name || user?.username || '',
            startTime: '',
            finishTime: '',
            weatherConditions: [],
            works: [],
            actualWorks: [],
            correctorUsed: 'No',
            correctorDetails: [],
            siteInstructions: '',
            additionalComments: '',
            sgaSignName: user?.name || user?.username || '',
            sgaSignature: '',
            clientSignName: '',
            clientSignature: '',
            plantEquipment: [],
            trucks: [],
            labour: [],
            onSiteTests: [],
            otherComments: '',
            teethUsage: '',
          },
          siteRecord: {
            hazardLog: [],
            siteVisitors: [],
          },
          itpChecklist,
          asphaltPlacement: {
            date: mockJob.jobDate,
            lotNo: '',
            sheetNo: '',
            material: '',
            pavementSurfaceCondition: '',
            rainfallDuringShift: '',
            rainfallActions: '',
            rollingPatternId: '',
            weatherConditions: [],
            placements: [],
          },
          straightEdge: {
            lotNo: '',
            date: '',
            location: '',
            mixType: '',
            testedBy: '',
            straightEdgeId: '',
            tests: [],
            supervisor: '',
            supervisorSignature: '',
          },
          sitePhotos: [],
          damagePhotos: [],
          lastUpdated: new Date().toISOString(),
        };

        setQaPack(initialQaPack);

        // Try to load draft from localStorage
        const draftKey = `qa-pack-draft-${jobId}`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          try {
            const parsedDraft = JSON.parse(savedDraft);
            setQaPack(parsedDraft);
            setLastSaved(parsedDraft.lastUpdated);
          } catch (error) {
            console.error('Failed to parse saved draft:', error);
          }
        }
      } catch (error) {
        console.error('Error loading QA Pack data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [jobId, user]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!qaPack || !jobId) return;

    // Clear existing interval
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }

    // Set up new interval
    autoSaveIntervalRef.current = setInterval(() => {
      handleSaveDraft();
    }, 30000); // 30 seconds

    // Cleanup on unmount
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [qaPack, jobId]);

  // Save draft
  const handleSaveDraft = useCallback(async () => {
    if (!qaPack || !jobId) return;

    setIsSaving(true);
    try {
      const draftKey = `qa-pack-draft-${jobId}`;
      const updatedQaPack = {
        ...qaPack,
        lastUpdated: new Date().toISOString(),
      };

      // Save to localStorage
      localStorage.setItem(draftKey, JSON.stringify(updatedQaPack));
      setLastSaved(updatedQaPack.lastUpdated);

      // TODO: Also save to server via API
      // await saveDraft({ id: jobId, data: updatedQaPack });
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsSaving(false);
    }
  }, [qaPack, jobId]);

  // Manual save
  const handleManualSave = () => {
    handleSaveDraft();
  };

  // Update section data
  const handleUpdate = useCallback((section: keyof QaPack, data: any) => {
    setQaPack((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [section]: data,
      };
    });
  }, []);

  // Calculate totals from Asphalt Placement
  const { totalArea, totalTonnesDelivered, totalTonnesLaid } = useMemo(() => {
    if (!qaPack?.asphaltPlacement?.placements) {
      return { totalArea: '0.00', totalTonnesDelivered: '0.00', totalTonnesLaid: '0.00' };
    }
    const placements = qaPack.asphaltPlacement.placements;
    const area = placements.reduce((acc, p) => acc + (parseFloat(p.area) || 0), 0);
    const delivered = placements.reduce((acc, p) => acc + (parseFloat(p.tonnes) || 0), 0);
    const laid = placements.reduce((acc, p) => {
      const pArea = parseFloat(p.area) || 0;
      const pDepth = parseFloat(p.depth) || 0;
      return acc + pArea * (pDepth / 1000) * 2.36;
    }, 0);

    return {
      totalArea: area.toFixed(2),
      totalTonnesDelivered: delivered.toFixed(2),
      totalTonnesLaid: laid.toFixed(2),
    };
  }, [qaPack?.asphaltPlacement?.placements]);

  // Define tabs
  const tabs: TabConfig[] = useMemo(() => {
    const baseTabs: TabConfig[] = [
      { id: 'jobSheet', label: 'Job Sheet', isComplete: true },
      { id: 'sgaDailyReport', label: 'Daily Report', isComplete: false },
      { id: 'siteRecord', label: 'Site Record', isComplete: false },
    ];

    // Add ITP tab if template exists
    if (qaPack?.itpChecklist?.sections && qaPack.itpChecklist.sections.length > 0) {
      baseTabs.push({ id: 'itpChecklist', label: 'ITP Checklist', isComplete: false });
    }

    // Add Asphalt-specific tabs
    if (job?.division === 'Asphalt') {
      baseTabs.push(
        { id: 'asphaltPlacement', label: 'Asphalt Placement', isComplete: false },
        { id: 'straightEdge', label: 'Straight Edge', isComplete: false }
      );
    }

    // Add Site Photos tab
    baseTabs.push({ id: 'sitePhotos', label: 'Site Photos', isComplete: false });

    return baseTabs;
  }, [job, qaPack]);

  // Tab navigation
  const activeTabIndex = tabs.findIndex((t) => t.id === activeTab);

  const handlePrevStep = () => {
    if (activeTabIndex > 0) {
      setActiveTab(tabs[activeTabIndex - 1].id);
    }
  };

  const handleNextStep = () => {
    if (activeTabIndex < tabs.length - 1) {
      setActiveTab(tabs[activeTabIndex + 1].id);
    }
  };

  // Submit QA Pack
  const handleSubmitClick = () => {
    // Validate
    if (qaPack?.sgaDailyReport?.correctorUsed === 'Yes' && !qaPack.sgaDailyReport.clientSignature) {
      alert('Client signature is required when corrector has been used. Please get the client to sign off in the Daily Report tab.');
      setActiveTab('sgaDailyReport');
      return;
    }

    setShowSubmitModal(true);
  };

  const handleFinalSubmit = async () => {
    if (!qaPack || !job) return;

    try {
      const foremanSignature = foremanSignatureRef.current?.toDataURL() || '';

      if (!foremanSignature) {
        alert('Please provide your signature to submit the QA Pack.');
        return;
      }

      // TODO: Call API to submit QA Pack
      // await submitReport({ ...qaPack, foremanSignature });

      // Clear draft from localStorage
      const draftKey = `qa-pack-draft-${jobId}`;
      localStorage.removeItem(draftKey);

      alert('QA Pack submitted successfully!');
      navigate('/reports');
    } catch (error) {
      console.error('Error submitting QA Pack:', error);
      alert('Failed to submit QA Pack. Please try again.');
    }
  };

  // Render active tab content
  const renderActiveTab = () => {
    if (!qaPack || !job) return null;

    switch (activeTab) {
      case 'jobSheet':
        return <JobSheetDisplay job={job} jobSheet={job.jobSheetData} />;

      case 'sgaDailyReport':
        return (
          <DailyReportForm
            job={job}
            initialData={qaPack.sgaDailyReport!}
            onUpdate={(data) => handleUpdate('sgaDailyReport', data)}
            qaSpec={job.qaSpec}
            isJobSheetAvailable={!!job.jobSheetData}
            totalArea={totalArea}
            totalTonnesDelivered={totalTonnesDelivered}
            totalTonnesLaid={totalTonnesLaid}
            crewResources={crewResources}
            equipmentResources={equipmentResources}
          />
        );

      case 'siteRecord':
        return <SiteRecordForm initialData={qaPack.siteRecord!} onUpdate={(data) => handleUpdate('siteRecord', data)} />;

      case 'itpChecklist':
        if (!qaPack.itpChecklist || qaPack.itpChecklist.sections.length === 0) {
          return (
            <div className="p-6 text-center text-gray-500 bg-white border rounded-lg">
              No ITP Checklist is required for this job's QA specification.
            </div>
          );
        }
        return <ItpChecklistForm initialData={qaPack.itpChecklist} onUpdate={(data) => handleUpdate('itpChecklist', data)} />;

      case 'asphaltPlacement':
        return (
          <AsphaltPlacementForm
            job={job}
            initialData={qaPack.asphaltPlacement!}
            onUpdate={(data) => handleUpdate('asphaltPlacement', data)}
          />
        );

      case 'straightEdge':
        return <StraightEdgeForm initialData={qaPack.straightEdge!} onUpdate={(data) => handleUpdate('straightEdge', data)} />;

      case 'sitePhotos':
        return <SitePhotosForm initialData={qaPack.sitePhotos || []} onUpdate={(data) => handleUpdate('sitePhotos', data)} />;

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      
        <PageContainer>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 border-4 border-sga-100 border-t-sga-700 rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading QA Pack...</p>
            </div>
          </div>
        </PageContainer>
      
    );
  }

  if (!job || !qaPack) {
    return (
      
        <PageContainer>
          <div className="text-center py-12">
            <p className="text-gray-600">Job not found</p>
            <button onClick={() => navigate('/jobs')} className="mt-4 text-sga-700 hover:underline">
              Back to Jobs
            </button>
          </div>
        </PageContainer>
      
    );
  }

  return (
    
      <PageContainer>
        <PageHeader
          title={job.projectName}
          description={`Client: ${job.client} | Job No: ${job.jobNo} | Location: ${job.location}`}
          actions={
            <div className="flex items-center space-x-4">
              {lastSaved && (
                <span className="text-sm text-gray-500">
                  Last saved: {new Date(lastSaved).toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={handleManualSave}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-sga-700 bg-white border border-sga-700 rounded-md hover:bg-sga-50 disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={handleSubmitClick}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Review & Submit QA Pack
              </button>
            </div>
          }
        />

        {/* Tab Navigation + Guided Mode Toggle */}
        <div className="sticky top-16 z-10 bg-white border-b border-gray-200 py-2 mb-6">
          <div className="flex justify-between items-center">
            <QaPackTabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isGuidedMode={isGuidedMode}
            />
            <div className="flex items-center space-x-2">
              <label htmlFor="guided-mode-toggle" className="text-sm font-medium text-gray-700">
                Guided Mode
              </label>
              <button
                id="guided-mode-toggle"
                onClick={() => setIsGuidedMode(!isGuidedMode)}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sga-500 ${
                  isGuidedMode ? 'bg-sga-700' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                    isGuidedMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-4">{renderActiveTab()}</div>

        {/* Guided Mode Navigation */}
        {isGuidedMode && (
          <div className="flex justify-between mt-8 p-4 bg-white border-t sticky bottom-0">
            <button
              onClick={handlePrevStep}
              disabled={activeTabIndex === 0}
              className="inline-flex items-center px-6 py-2 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous Step
            </button>
            <button
              onClick={handleNextStep}
              disabled={activeTabIndex === tabs.length - 1}
              className="inline-flex items-center px-6 py-2 font-semibold text-white bg-sga-700 rounded-md hover:bg-sga-800 disabled:opacity-50"
            >
              Next Step
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        )}

        {/* Submit Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Submit QA Pack</h3>
              <p className="text-gray-600 mb-4">
                Please sign below to confirm submission of this QA Pack. Once submitted, you will not be able to edit it.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Foreman Signature</label>
                <SignaturePad ref={foremanSignatureRef} />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalSubmit}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Submit QA Pack
                </button>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    
  );
};

export default QaPackPage;
