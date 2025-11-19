/**
 * PDF Generation Example
 *
 * This file demonstrates how to use the PDF generation components
 * in your application.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import PdfPreviewModal from '@/components/pdf/PdfPreviewModal';
import {
  generateJobSheetPdf,
  generateSamplingPdf,
  generateIncidentPdf,
  generateNcrPdf,
  type JobSheetData,
  type SamplingPlanData,
  type IncidentReportData,
  type NcrData,
} from '@/services/pdfApi';

const PdfGenerationExample: React.FC = () => {
  const [showJobSheetPreview, setShowJobSheetPreview] = useState(false);
  const [showSamplingPreview, setShowSamplingPreview] = useState(false);
  const [showIncidentPreview, setShowIncidentPreview] = useState(false);
  const [showNcrPreview, setShowNcrPreview] = useState(false);

  // Example Job Sheet Data
  const jobSheetData: JobSheetData = {
    jobNumber: 'JS-2024-001',
    date: '2024-01-15',
    client: 'Melbourne Airport',
    location: 'Runway 16/34',
    description: 'Safety grooving on main runway surface',
    projectManager: 'John Smith',
    supervisor: 'Jane Doe',
    crew: ['Mike Johnson', 'Sarah Williams', 'Tom Brown'],
    equipment: ['Grooving Machine A', 'Water Truck B', 'Safety Cones'],
    materials: [
      { name: 'Concrete Sealant', quantity: 50, unit: 'L' },
      { name: 'Marking Paint', quantity: 10, unit: 'cans' },
    ],
    safetyNotes: 'All crew members briefed on runway safety protocols',
    qualityChecks: [
      { item: 'Groove Depth', passed: true, notes: '3mm uniform depth' },
      { item: 'Groove Spacing', passed: true, notes: '25mm spacing verified' },
      { item: 'Surface Cleanup', passed: true },
    ],
  };

  // Example Sampling Plan Data
  const samplingPlanData: SamplingPlanData = {
    planId: 'SP-2024-001',
    date: '2024-01-15',
    jobNumber: 'JS-2024-001',
    materialType: 'Concrete Surface',
    sampleSize: 20,
    samplingMethod: 'Random Grid Pattern',
    frequency: 'Every 50 meters',
    locations: ['Section A1', 'Section B2', 'Section C3'],
    testingCriteria: [
      {
        parameter: 'Groove Depth',
        specification: '3mm ± 0.5mm',
        method: 'Digital Caliper',
      },
      {
        parameter: 'Surface Texture',
        specification: 'HS > 0.4',
        method: 'Skid Resistance Tester',
      },
    ],
    inspector: 'Jane Doe',
    notes: 'Weather conditions optimal for testing',
  };

  // Example Incident Report Data
  const incidentReportData: IncidentReportData = {
    incidentId: 'IR-2024-001',
    date: '2024-01-15',
    time: '14:30',
    location: 'Runway 16/34, Section B',
    severity: 'Low',
    reporter: 'Jane Doe',
    description: 'Minor equipment malfunction on grooving machine',
    witnessess: ['Mike Johnson', 'Tom Brown'],
    immediateActions: 'Machine shut down immediately, area secured',
    rootCause: 'Hydraulic line wear detected during inspection',
    correctiveActions: [
      {
        action: 'Replace hydraulic line',
        responsible: 'Maintenance Team',
        dueDate: '2024-01-16',
      },
      {
        action: 'Implement daily hydraulic checks',
        responsible: 'Operations Manager',
        dueDate: '2024-01-20',
      },
    ],
  };

  // Example NCR Data
  const ncrData: NcrData = {
    ncrNumber: 'NCR-2024-001',
    date: '2024-01-15',
    jobNumber: 'JS-2024-001',
    status: 'Open',
    priority: 'Medium',
    nonConformance: 'Groove depth in Section C3 measured 2.3mm, below specification of 3mm ± 0.5mm',
    raisedBy: 'Jane Doe - QA Inspector',
    assignedTo: 'John Smith - Project Manager',
    category: 'Quality Defect',
    detectedAt: 'Final Inspection',
    impact: 'Potential reduced surface grip in affected area',
    rootCause: 'Machine calibration drift during extended operation',
    correctiveAction: 'Re-groove affected section after machine recalibration',
    preventiveAction: 'Implement mid-shift calibration checks',
    notes: 'Client notified, rework scheduled for next morning',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">PDF Generation Examples</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Job Sheet Example */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Job Sheet PDF</h2>
          <p className="text-sm text-gray-600 mb-4">
            Generate a job sheet with crew details, equipment, and quality checks.
          </p>
          <Button
            onClick={() => setShowJobSheetPreview(true)}
            className="w-full bg-[#F5A524] hover:bg-[#E09410]"
          >
            Preview Job Sheet
          </Button>
        </div>

        {/* Sampling Plan Example */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Sampling Plan PDF</h2>
          <p className="text-sm text-gray-600 mb-4">
            Generate a sampling plan with test criteria and locations.
          </p>
          <Button
            onClick={() => setShowSamplingPreview(true)}
            className="w-full bg-[#F5A524] hover:bg-[#E09410]"
          >
            Preview Sampling Plan
          </Button>
        </div>

        {/* Incident Report Example */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Incident Report PDF</h2>
          <p className="text-sm text-gray-600 mb-4">
            Generate an incident report with corrective actions.
          </p>
          <Button
            onClick={() => setShowIncidentPreview(true)}
            className="w-full bg-[#F5A524] hover:bg-[#E09410]"
          >
            Preview Incident Report
          </Button>
        </div>

        {/* NCR Example */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">NCR PDF</h2>
          <p className="text-sm text-gray-600 mb-4">
            Generate a non-conformance report with root cause analysis.
          </p>
          <Button
            onClick={() => setShowNcrPreview(true)}
            className="w-full bg-[#F5A524] hover:bg-[#E09410]"
          >
            Preview NCR
          </Button>
        </div>
      </div>

      {/* PDF Preview Modals */}
      <PdfPreviewModal
        isOpen={showJobSheetPreview}
        onClose={() => setShowJobSheetPreview(false)}
        title="Job Sheet"
        documentType="jobsheet"
        data={jobSheetData}
        onGenerate={generateJobSheetPdf}
      />

      <PdfPreviewModal
        isOpen={showSamplingPreview}
        onClose={() => setShowSamplingPreview(false)}
        title="Sampling Plan"
        documentType="sampling"
        data={samplingPlanData}
        onGenerate={generateSamplingPdf}
      />

      <PdfPreviewModal
        isOpen={showIncidentPreview}
        onClose={() => setShowIncidentPreview(false)}
        title="Incident Report"
        documentType="incident"
        data={incidentReportData}
        onGenerate={generateIncidentPdf}
      />

      <PdfPreviewModal
        isOpen={showNcrPreview}
        onClose={() => setShowNcrPreview(false)}
        title="Non-Conformance Report"
        documentType="ncr"
        data={ncrData}
        onGenerate={generateNcrPdf}
      />

      {/* Usage Instructions */}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">Usage Instructions</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">1. Import Components</h3>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
{`import PdfPreviewModal from '@/components/pdf/PdfPreviewModal';
import { generateJobSheetPdf } from '@/services/pdfApi';`}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">2. Prepare Your Data</h3>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
{`const jobData = {
  jobNumber: 'JS-2024-001',
  date: '2024-01-15',
  client: 'Client Name',
  location: 'Site Location',
  description: 'Job description...',
  // ... other fields
};`}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">3. Use the Preview Modal</h3>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
{`<PdfPreviewModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Job Sheet"
  documentType="jobsheet"
  data={jobData}
  onGenerate={generateJobSheetPdf}
/>`}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">4. Document Library Integration</h3>
            <p className="text-gray-600 mb-2">
              After generating PDFs, they can be viewed in the Document Library:
            </p>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
{`import DocumentLibrary from '@/pages/documents/DocumentLibrary';

// Use in your routing:
<Route path="/documents" element={<DocumentLibrary />} />`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfGenerationExample;
