/**
 * ITP (Inspection and Test Plan) Form
 *
 * Reusable component for different ITP types:
 * - SGA-ITP-001: Profiling
 * - SGA-ITP-002: Wearing Course
 * - SGA-ITP-003: Line Marking
 * - SGA-ITP-004: Grooving
 * - SGA-ITP-005: Seal
 *
 * Features:
 * - Test Point types: V (Visual), W (Witness), H (Hold Point)
 * - Role Keys: SS (Site Supervisor), PE (Project Engineer), QA
 * - Dual signature capture (Client & SGA)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ItpFormData,
  ItpActivityItem,
  TestPointType,
  RoleKey,
  Job,
} from '../../types';
import SignaturePad from '../common/SignaturePad';

interface ItpFormProps {
  initialData: ItpFormData;
  onUpdate: (data: ItpFormData) => void;
  job: Job;
  itpType: 'profiling' | 'wearing-course' | 'line-marking' | 'grooving' | 'seal';
  documentNumber: string;
}

const formStyles = {
  input:
    'w-full px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sga-500 focus:border-sga-500',
  readOnlyInput:
    'w-full px-2 py-1 text-sm text-gray-700 bg-gray-200 border border-gray-300 rounded-md focus:outline-none',
  label: 'block text-sm font-medium text-gray-700 mb-1',
  checkbox: 'w-4 h-4 text-sga-600 border-gray-300 rounded focus:ring-sga-500',
};

// ITP Activity Templates
const ITP_TEMPLATES: Record<string, Omit<ItpActivityItem, 'id' | 'clientSignature' | 'sgaSignature' | 'comments'>[]> = {
  'profiling': [
    { itemNo: 1, activity: 'Pre-start inspection', acceptanceCriteria: 'Plant/equipment checked & operational', verifyingDocument: 'Pre-start checklist', frequency: 'Daily', testPoint: 'V', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 2, activity: 'Traffic management setup', acceptanceCriteria: 'TMP implemented per approved plan', verifyingDocument: 'TMP', frequency: 'Per shift', testPoint: 'V', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 3, activity: 'Survey set-out verification', acceptanceCriteria: 'Marks verified against design', verifyingDocument: 'Survey report', frequency: 'Per lot', testPoint: 'H', roleKey: 'PE', recordOfConformity: '' },
    { itemNo: 4, activity: 'Drum type selection', acceptanceCriteria: 'Fine (≤8mm) or Standard (15mm) per spec', verifyingDocument: 'Spec 508', frequency: 'Per job', testPoint: 'V', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 5, activity: 'Profiling depth control', acceptanceCriteria: '±3mm of specified depth', verifyingDocument: 'Depth measurements', frequency: 'Every 25m', testPoint: 'W', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 6, activity: 'Surface texture check', acceptanceCriteria: '≤2.0mm avg (Type 1), ≤2.3mm individual', verifyingDocument: 'Texture test', frequency: 'Per lot', testPoint: 'H', roleKey: 'QA', recordOfConformity: '' },
    { itemNo: 7, activity: 'Edge alignment', acceptanceCriteria: 'Clean vertical edges, no overcut', verifyingDocument: 'Visual inspection', frequency: 'Continuous', testPoint: 'V', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 8, activity: 'Material removal/disposal', acceptanceCriteria: 'RAP removed to stockpile/disposal', verifyingDocument: 'Disposal records', frequency: 'Daily', testPoint: 'V', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 9, activity: 'Final surface inspection', acceptanceCriteria: 'No loose material, ready for overlay', verifyingDocument: 'Inspection report', frequency: 'Per lot', testPoint: 'H', roleKey: 'PE', recordOfConformity: '' },
    { itemNo: 10, activity: 'As-built documentation', acceptanceCriteria: 'Depths, chainages, areas recorded', verifyingDocument: 'As-built records', frequency: 'Per lot', testPoint: 'V', roleKey: 'SS', recordOfConformity: '' },
  ],
  'wearing-course': [
    { itemNo: 1, activity: 'Pre-start inspection', acceptanceCriteria: 'Plant/equipment checked & operational', verifyingDocument: 'Pre-start checklist', frequency: 'Daily', testPoint: 'V', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 2, activity: 'Traffic management setup', acceptanceCriteria: 'TMP implemented per approved plan', verifyingDocument: 'TMP', frequency: 'Per shift', testPoint: 'V', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 3, activity: 'Surface preparation', acceptanceCriteria: 'Clean, dry, free of contaminants', verifyingDocument: 'Visual inspection', frequency: 'Pre-paving', testPoint: 'H', roleKey: 'PE', recordOfConformity: '' },
    { itemNo: 4, activity: 'Tack coat application', acceptanceCriteria: '0.43 L/m² residual (0.6 L/m² dilute)', verifyingDocument: 'Spec 504 Sec 9.3', frequency: 'Per lot', testPoint: 'W', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 5, activity: 'Pavement temperature check', acceptanceCriteria: '≥15°C (≥20°C for PMB)', verifyingDocument: 'Temp records', frequency: 'Pre-paving', testPoint: 'H', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 6, activity: 'Mix delivery temperature', acceptanceCriteria: 'DGA: 140-170°C, PMB: 160-185°C', verifyingDocument: 'Docket temps', frequency: 'Per load', testPoint: 'H', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 7, activity: 'Paver operation', acceptanceCriteria: 'Speed, screed settings per spec', verifyingDocument: 'Paver log', frequency: 'Continuous', testPoint: 'V', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 8, activity: 'Rolling pattern compliance', acceptanceCriteria: 'Per approved rolling pattern', verifyingDocument: 'Rolling pattern doc', frequency: 'Per lot', testPoint: 'W', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 9, activity: 'Joint construction', acceptanceCriteria: '≤3mm transverse, ≤5mm over 3m', verifyingDocument: 'Straight edge test', frequency: 'Per joint', testPoint: 'H', roleKey: 'QA', recordOfConformity: '' },
    { itemNo: 10, activity: 'Surface level check', acceptanceCriteria: 'Within design tolerance', verifyingDocument: 'Survey check', frequency: 'Per lot', testPoint: 'W', roleKey: 'PE', recordOfConformity: '' },
    { itemNo: 11, activity: 'Core sampling', acceptanceCriteria: 'Taken within 24hrs, results in 48hrs', verifyingDocument: 'Spec 504 Cl 234', frequency: 'Per lot', testPoint: 'H', roleKey: 'QA', recordOfConformity: '' },
    { itemNo: 12, activity: 'Density test', acceptanceCriteria: '≥93% Marshall (91% shared paths)', verifyingDocument: 'Lab test report', frequency: 'Per lot', testPoint: 'H', roleKey: 'QA', recordOfConformity: '' },
    { itemNo: 13, activity: 'Straight edge test', acceptanceCriteria: '≤3mm longitudinal, ≤5mm transverse', verifyingDocument: 'Test report', frequency: 'Per lot', testPoint: 'H', roleKey: 'QA', recordOfConformity: '' },
    { itemNo: 14, activity: 'Final inspection', acceptanceCriteria: 'Area clean, acceptable finish', verifyingDocument: 'Inspection report', frequency: 'Per lot', testPoint: 'H', roleKey: 'PE', recordOfConformity: '' },
  ],
  'line-marking': [
    { itemNo: 1, activity: 'Surface preparation', acceptanceCriteria: 'Clean, dry surface', verifyingDocument: 'Visual inspection', frequency: 'Pre-marking', testPoint: 'V', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 2, activity: 'Line layout verification', acceptanceCriteria: 'Per approved marking plan', verifyingDocument: 'Marking plan', frequency: 'Per section', testPoint: 'H', roleKey: 'PE', recordOfConformity: '' },
    { itemNo: 3, activity: 'Material check', acceptanceCriteria: 'Correct paint/thermoplastic type', verifyingDocument: 'Product cert', frequency: 'Per batch', testPoint: 'V', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 4, activity: 'Application thickness', acceptanceCriteria: 'Per manufacturer spec', verifyingDocument: 'Thickness test', frequency: 'Per 500m', testPoint: 'W', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 5, activity: 'Retroreflectivity test', acceptanceCriteria: 'Min values per spec', verifyingDocument: 'Test report', frequency: 'Per lot', testPoint: 'H', roleKey: 'QA', recordOfConformity: '' },
    { itemNo: 6, activity: 'Final inspection', acceptanceCriteria: 'Lines complete, clean finish', verifyingDocument: 'Inspection report', frequency: 'Per section', testPoint: 'H', roleKey: 'PE', recordOfConformity: '' },
  ],
  'grooving': [
    { itemNo: 1, activity: 'Pre-start inspection', acceptanceCriteria: 'Equipment calibrated', verifyingDocument: 'Pre-start checklist', frequency: 'Daily', testPoint: 'V', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 2, activity: 'Groove spacing check', acceptanceCriteria: 'Per specification requirements', verifyingDocument: 'Spec document', frequency: 'Per 100m', testPoint: 'W', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 3, activity: 'Groove depth check', acceptanceCriteria: '≤5mm depth', verifyingDocument: 'Depth measurements', frequency: 'Per 100m', testPoint: 'W', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 4, activity: 'Slurry management', acceptanceCriteria: 'Contained and disposed correctly', verifyingDocument: 'Environmental plan', frequency: 'Continuous', testPoint: 'V', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 5, activity: 'Final inspection', acceptanceCriteria: 'Uniform grooves, clean surface', verifyingDocument: 'Inspection report', frequency: 'Per lot', testPoint: 'H', roleKey: 'PE', recordOfConformity: '' },
  ],
  'seal': [
    { itemNo: 1, activity: 'Pre-start inspection', acceptanceCriteria: 'Plant/equipment operational', verifyingDocument: 'Pre-start checklist', frequency: 'Daily', testPoint: 'V', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 2, activity: 'Surface preparation', acceptanceCriteria: 'Clean, dry, primed if required', verifyingDocument: 'Visual inspection', frequency: 'Pre-seal', testPoint: 'H', roleKey: 'PE', recordOfConformity: '' },
    { itemNo: 3, activity: 'Binder temperature', acceptanceCriteria: 'Per product specification', verifyingDocument: 'Temp records', frequency: 'Per load', testPoint: 'W', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 4, activity: 'Binder application rate', acceptanceCriteria: 'Per design rate L/m²', verifyingDocument: 'Calibration records', frequency: 'Per 500m', testPoint: 'H', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 5, activity: 'Aggregate spread rate', acceptanceCriteria: 'Per design rate m³/m²', verifyingDocument: 'Calibration records', frequency: 'Per 500m', testPoint: 'H', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 6, activity: 'Rolling', acceptanceCriteria: 'Per approved pattern', verifyingDocument: 'Rolling log', frequency: 'Continuous', testPoint: 'V', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 7, activity: 'Excess aggregate removal', acceptanceCriteria: 'Loose aggregate swept', verifyingDocument: 'Visual inspection', frequency: 'Post-rolling', testPoint: 'V', roleKey: 'SS', recordOfConformity: '' },
    { itemNo: 8, activity: 'Final inspection', acceptanceCriteria: 'Uniform coverage, no bleeding', verifyingDocument: 'Inspection report', frequency: 'Per lot', testPoint: 'H', roleKey: 'PE', recordOfConformity: '' },
  ],
};

const ITP_TITLES: Record<string, string> = {
  'profiling': 'ITP - Profiling (Cold Planing)',
  'wearing-course': 'ITP - Dense Graded Asphalt Wearing Course',
  'line-marking': 'ITP - Line Marking',
  'grooving': 'ITP - Grooving',
  'seal': 'ITP - Spray Seal',
};

const TEST_POINT_LABELS: Record<TestPointType, string> = {
  'V': 'Visual',
  'W': 'Witness',
  'H': 'Hold Point',
};

const ROLE_KEY_LABELS: Record<RoleKey, string> = {
  'SS': 'Site Supervisor',
  'PE': 'Project Engineer',
  'QA': 'QA Officer',
};

const createDefaultActivities = (itpType: string): ItpActivityItem[] => {
  const template = ITP_TEMPLATES[itpType] || [];
  return template.map((item, index) => ({
    ...item,
    id: `itp-activity-${index + 1}`,
    clientSignature: '',
    sgaSignature: '',
    comments: '',
  }));
};

export const ItpForm: React.FC<ItpFormProps> = ({
  initialData,
  onUpdate,
  job,
  itpType,
  documentNumber,
}) => {
  const [data, setData] = useState<ItpFormData>({
    ...initialData,
    activities:
      initialData.activities?.length > 0
        ? initialData.activities
        : createDefaultActivities(itpType),
  });

  const finalSignaturePadRef = useRef<{ toDataURL: () => string; clear: () => void }>(null);

  useEffect(() => {
    onUpdate(data);
  }, [data, onUpdate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleActivityChange = (
    index: number,
    field: keyof ItpActivityItem,
    value: any
  ) => {
    const updatedActivities = [...data.activities];
    updatedActivities[index] = { ...updatedActivities[index], [field]: value };
    setData((prev) => ({ ...prev, activities: updatedActivities }));
  };

  const handleFinalSignatureChange = () => {
    const signatureData = finalSignaturePadRef.current?.toDataURL() || '';
    setData((prev) => ({ ...prev, finalInspectorSignature: signatureData }));
  };

  const handleClearFinalSignature = () => {
    if (window.confirm('Clear final inspection signature?')) {
      finalSignaturePadRef.current?.clear();
      setData((prev) => ({ ...prev, finalInspectorSignature: '' }));
    }
  };

  return (
    <div className="p-6 space-y-6 bg-white border border-gray-200 rounded-lg shadow-md">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-sga-700">
            {ITP_TITLES[itpType] || 'Inspection and Test Plan'}
          </h3>
          <p className="text-sm text-gray-500">{documentNumber}</p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <p className="font-semibold mb-1">Test Points:</p>
          <p>V = Visual | W = Witness | H = Hold Point</p>
          <p className="font-semibold mt-2 mb-1">Roles:</p>
          <p>SS = Site Supervisor | PE = Project Engineer</p>
        </div>
      </div>

      {/* ITP Header Information */}
      <div className="p-4 space-y-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-semibold">ITP Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="itp-client" className={formStyles.label}>
              Client
            </label>
            <input
              id="itp-client"
              type="text"
              name="client"
              value={data.client || job.client}
              onChange={handleChange}
              className={formStyles.input}
            />
          </div>
          <div>
            <label htmlFor="itp-project" className={formStyles.label}>
              Project
            </label>
            <input
              id="itp-project"
              type="text"
              name="project"
              value={data.project || job.projectName}
              onChange={handleChange}
              className={formStyles.input}
            />
          </div>
          <div className="lg:col-span-2">
            <label htmlFor="itp-specifications" className={formStyles.label}>
              Specifications
            </label>
            <input
              id="itp-specifications"
              type="text"
              name="specifications"
              value={data.specifications || job.qaSpec}
              onChange={handleChange}
              className={formStyles.input}
              placeholder="e.g., MRWA Spec 504, Spec 508"
            />
          </div>
          <div>
            <label htmlFor="itp-lotNo" className={formStyles.label}>
              Lot No
            </label>
            <input
              id="itp-lotNo"
              type="text"
              name="lotNo"
              value={data.lotNo}
              onChange={handleChange}
              className={formStyles.input}
            />
          </div>
          <div className="lg:col-span-2">
            <label htmlFor="itp-lotDescription" className={formStyles.label}>
              Lot Description
            </label>
            <input
              id="itp-lotDescription"
              type="text"
              name="lotDescription"
              value={data.lotDescription}
              onChange={handleChange}
              className={formStyles.input}
              placeholder="e.g., CH 0+000 to CH 1+500, LHS"
            />
          </div>
          <div>
            <label htmlFor="itp-date" className={formStyles.label}>
              Date
            </label>
            <input
              id="itp-date"
              type="date"
              name="date"
              value={data.date || job.jobDate}
              onChange={handleChange}
              className={formStyles.input}
            />
          </div>
          <div>
            <label htmlFor="itp-preparedBy" className={formStyles.label}>
              Prepared By
            </label>
            <input
              id="itp-preparedBy"
              type="text"
              name="preparedBy"
              value={data.preparedBy}
              onChange={handleChange}
              className={formStyles.input}
            />
          </div>
          <div>
            <label htmlFor="itp-approvedBy" className={formStyles.label}>
              Approved By
            </label>
            <input
              id="itp-approvedBy"
              type="text"
              name="approvedBy"
              value={data.approvedBy}
              onChange={handleChange}
              className={formStyles.input}
            />
          </div>
          <div>
            <label htmlFor="itp-documentNumber" className={formStyles.label}>
              Document No
            </label>
            <input
              id="itp-documentNumber"
              type="text"
              name="documentNumber"
              value={data.documentNumber || documentNumber}
              onChange={handleChange}
              className={formStyles.input}
            />
          </div>
          <div>
            <label htmlFor="itp-revision" className={formStyles.label}>
              Revision
            </label>
            <input
              id="itp-revision"
              type="text"
              name="revision"
              value={data.revision}
              onChange={handleChange}
              className={formStyles.input}
              placeholder="e.g., Rev 1"
            />
          </div>
        </div>
      </div>

      {/* Activity Items Table */}
      <div className="space-y-4">
        <h4 className="font-semibold">Inspection Activities</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-2 text-xs font-medium text-gray-700 border-b border-r w-8">
                  #
                </th>
                <th className="px-2 py-2 text-xs font-medium text-gray-700 border-b border-r text-left min-w-[150px]">
                  Activity/Task
                </th>
                <th className="px-2 py-2 text-xs font-medium text-gray-700 border-b border-r text-left min-w-[150px]">
                  Acceptance Criteria
                </th>
                <th className="px-2 py-2 text-xs font-medium text-gray-700 border-b border-r text-left min-w-[100px]">
                  Verifying Doc
                </th>
                <th className="px-2 py-2 text-xs font-medium text-gray-700 border-b border-r w-20">
                  Frequency
                </th>
                <th className="px-2 py-2 text-xs font-medium text-gray-700 border-b border-r w-12">
                  Test Pt
                </th>
                <th className="px-2 py-2 text-xs font-medium text-gray-700 border-b border-r w-12">
                  Role
                </th>
                <th className="px-2 py-2 text-xs font-medium text-gray-700 border-b border-r w-24">
                  Conformity
                </th>
                <th className="px-2 py-2 text-xs font-medium text-gray-700 border-b text-left min-w-[80px]">
                  Comments
                </th>
              </tr>
            </thead>
            <tbody>
              {data.activities.map((activity, index) => (
                <tr
                  key={activity.id}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="px-2 py-2 text-gray-700 border-b border-r text-center">
                    {activity.itemNo}
                  </td>
                  <td className="px-2 py-2 text-gray-700 border-b border-r">
                    {activity.activity}
                  </td>
                  <td className="px-2 py-2 text-xs text-gray-600 border-b border-r">
                    {activity.acceptanceCriteria}
                  </td>
                  <td className="px-2 py-2 text-xs text-gray-600 border-b border-r">
                    {activity.verifyingDocument}
                  </td>
                  <td className="px-2 py-2 text-xs text-gray-600 border-b border-r text-center">
                    {activity.frequency}
                  </td>
                  <td className="px-2 py-2 border-b border-r text-center">
                    <span
                      className={`px-1 py-0.5 text-xs rounded ${
                        activity.testPoint === 'H'
                          ? 'bg-red-100 text-red-700 font-bold'
                          : activity.testPoint === 'W'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {activity.testPoint}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-xs text-gray-600 border-b border-r text-center">
                    {activity.roleKey}
                  </td>
                  <td className="px-2 py-2 border-b border-r">
                    <select
                      value={activity.recordOfConformity}
                      onChange={(e) =>
                        handleActivityChange(index, 'recordOfConformity', e.target.value)
                      }
                      className="w-full px-1 py-1 text-xs border border-gray-300 rounded"
                    >
                      <option value="">--</option>
                      <option value="Conform">Conform</option>
                      <option value="Non-Conform">Non-Conform</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </td>
                  <td className="px-2 py-2 border-b">
                    <input
                      type="text"
                      value={activity.comments}
                      onChange={(e) =>
                        handleActivityChange(index, 'comments', e.target.value)
                      }
                      className="w-full px-1 py-1 text-xs border border-gray-300 rounded"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Final Inspection Sign-off */}
      <div className="p-4 space-y-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-semibold text-sga-700">Final Inspection</h4>
        <div className="flex items-center space-x-4 mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="finalInspectionComplete"
              checked={data.finalInspectionComplete}
              onChange={handleChange}
              className={formStyles.checkbox}
            />
            <span className="ml-2 text-sm text-gray-700">
              Final inspection complete - All hold points verified
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={formStyles.label}>Inspector Name</label>
            <input
              type="text"
              name="finalInspectorName"
              value={data.finalInspectorName}
              onChange={handleChange}
              className={formStyles.input}
            />
          </div>
          <div>
            <label className={formStyles.label}>Inspection Date</label>
            <input
              type="date"
              name="finalInspectionDate"
              value={data.finalInspectionDate}
              onChange={handleChange}
              className={formStyles.input}
            />
          </div>
          <div className="lg:col-span-2">
            <label className={formStyles.label}>Inspector Signature</label>
            <div
              onMouseUp={handleFinalSignatureChange}
              onTouchEnd={handleFinalSignatureChange}
            >
              <SignaturePad
                ref={finalSignaturePadRef}
                initialSignature={data.finalInspectorSignature}
              />
            </div>
            <button
              onClick={handleClearFinalSignature}
              className="w-full mt-1 px-2 py-1 text-xs text-white bg-gray-600 rounded hover:bg-gray-700"
            >
              Clear Signature
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h5 className="font-semibold text-blue-800 mb-2">Legend</h5>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-blue-700">Test Points:</p>
            <ul className="text-blue-600">
              <li>
                <span className="bg-red-100 text-red-700 px-1 rounded font-bold">H</span>{' '}
                - Hold Point (requires sign-off)
              </li>
              <li>
                <span className="bg-yellow-100 text-yellow-700 px-1 rounded">W</span> -
                Witness Point
              </li>
              <li>
                <span className="bg-green-100 text-green-700 px-1 rounded">V</span> -
                Visual Inspection
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-blue-700">Roles:</p>
            <ul className="text-blue-600">
              <li>SS - Site Supervisor</li>
              <li>PE - Project Engineer</li>
              <li>QA - QA Officer</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItpForm;
