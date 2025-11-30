/**
 * ITR Asphalt Laying Form
 * Per SGA-QA-ITR-002 - Asphalt Laying Inspection and Test Report
 *
 * Contains 12 inspection items with Hold Point sign-offs for:
 * - SGA Representative
 * - DTI (Department of Transport and Infrastructure)
 * - GHD (Engineering Consultants)
 * - RTIO (Rio Tinto Iron Ore)
 * - Client Representative
 */

import React, { useState, useEffect, useRef } from 'react';
import { ItrAsphaltLayingData, ItrInspectionItem, ItrSignOff, Job } from '../../types';
import SignaturePad from '../common/SignaturePad';

interface ItrAsphaltLayingFormProps {
  initialData: ItrAsphaltLayingData;
  onUpdate: (data: ItrAsphaltLayingData) => void;
  job: Job;
}

const formStyles = {
  input:
    'w-full px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sga-500 focus:border-sga-500',
  readOnlyInput:
    'w-full px-2 py-1 text-sm text-gray-700 bg-gray-200 border border-gray-300 rounded-md focus:outline-none',
  label: 'block text-sm font-medium text-gray-700 mb-1',
  checkbox: 'w-4 h-4 text-sga-600 border-gray-300 rounded focus:ring-sga-500',
};

// Default 12 inspection items per SGA-QA-ITR-002
const DEFAULT_INSPECTION_ITEMS: Omit<ItrInspectionItem, 'id'>[] = [
  {
    itemNo: 1,
    description: 'Set out verification',
    acceptanceCriteria: 'Survey marks verified against approved drawings',
    status: '',
    holdPointSignOff: { sga: false },
    comments: '',
  },
  {
    itemNo: 2,
    description: 'Paving lot marked per approved plan',
    acceptanceCriteria: 'Lot boundaries clearly marked as per approved plan',
    status: '',
    holdPointSignOff: { sga: false },
    comments: '',
  },
  {
    itemNo: 3,
    description: 'Surface clean & dry',
    acceptanceCriteria: 'No loose material, water or contaminants on surface',
    status: '',
    holdPointSignOff: { sga: false },
    comments: '',
  },
  {
    itemNo: 4,
    description: 'Depressions >20mm corrected',
    acceptanceCriteria: 'All depressions >20mm filled and compacted',
    status: '',
    holdPointSignOff: { sga: false },
    comments: '',
  },
  {
    itemNo: 5,
    description: 'Pavement temperature ≥15°C',
    acceptanceCriteria: 'Pavement temp recorded and ≥15°C (or per spec for PMB)',
    status: '',
    holdPointSignOff: { sga: false },
    comments: '',
  },
  {
    itemNo: 6,
    description: 'Tack coat application 0.43 L/m²',
    acceptanceCriteria: 'Tack coat applied at 0.43 L/m² residual bitumen rate',
    status: '',
    holdPointSignOff: { sga: false },
    comments: '',
  },
  {
    itemNo: 7,
    description: 'Delivery temperatures 160°C-185°C',
    acceptanceCriteria: 'All loads verified between 160°C-185°C (PMB)',
    status: '',
    holdPointSignOff: { sga: false },
    comments: '',
  },
  {
    itemNo: 8,
    description: 'Rolling patterns compliance',
    acceptanceCriteria: 'Rolling per approved rolling pattern specification',
    status: '',
    holdPointSignOff: { sga: false },
    comments: '',
  },
  {
    itemNo: 9,
    description: 'Joint tolerances met',
    acceptanceCriteria: '≤3mm transverse, ≤5mm longitudinal over 3m',
    status: '',
    holdPointSignOff: { sga: false },
    comments: '',
  },
  {
    itemNo: 10,
    description: 'Core samples taken per Section 11.4.2 Cl 234',
    acceptanceCriteria: 'Cores taken within 24hrs, results within 48hrs',
    status: '',
    holdPointSignOff: { sga: false },
    comments: '',
  },
  {
    itemNo: 11,
    description: 'Final levels conforming',
    acceptanceCriteria: 'Surface levels within specified tolerance',
    status: '',
    holdPointSignOff: { sga: false },
    comments: '',
  },
  {
    itemNo: 12,
    description: 'Area clean and acceptable',
    acceptanceCriteria: 'Work area cleaned, debris removed, client accepted',
    status: '',
    holdPointSignOff: { sga: false },
    comments: '',
  },
];

const createDefaultInspectionItems = (): ItrInspectionItem[] => {
  return DEFAULT_INSPECTION_ITEMS.map((item, index) => ({
    ...item,
    id: `itr-item-${index + 1}`,
  }));
};

const createDefaultSignOff = (): ItrSignOff => ({
  name: '',
  position: '',
  signature: '',
  date: '',
});

export const ItrAsphaltLayingForm: React.FC<ItrAsphaltLayingFormProps> = ({
  initialData,
  onUpdate,
  job,
}) => {
  const [data, setData] = useState<ItrAsphaltLayingData>({
    ...initialData,
    inspectionItems:
      initialData.inspectionItems?.length > 0
        ? initialData.inspectionItems
        : createDefaultInspectionItems(),
    sgaRepresentative: initialData.sgaRepresentative || createDefaultSignOff(),
    clientRepresentative: initialData.clientRepresentative || createDefaultSignOff(),
  });

  const sgaSignaturePadRef = useRef<{ toDataURL: () => string; clear: () => void }>(null);
  const clientSignaturePadRef = useRef<{ toDataURL: () => string; clear: () => void }>(null);

  useEffect(() => {
    onUpdate(data);
  }, [data, onUpdate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInspectionItemChange = (
    index: number,
    field: keyof ItrInspectionItem,
    value: any
  ) => {
    const updatedItems = [...data.inspectionItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setData((prev) => ({ ...prev, inspectionItems: updatedItems }));
  };

  const handleHoldPointChange = (
    index: number,
    holdPointField: keyof ItrInspectionItem['holdPointSignOff'],
    checked: boolean
  ) => {
    const updatedItems = [...data.inspectionItems];
    updatedItems[index] = {
      ...updatedItems[index],
      holdPointSignOff: {
        ...updatedItems[index].holdPointSignOff,
        [holdPointField]: checked,
      },
    };
    setData((prev) => ({ ...prev, inspectionItems: updatedItems }));
  };

  const handleSignOffChange = (
    type: 'sgaRepresentative' | 'clientRepresentative',
    field: keyof ItrSignOff,
    value: string
  ) => {
    setData((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  };

  const handleSgaSignatureChange = () => {
    const signatureData = sgaSignaturePadRef.current?.toDataURL() || '';
    handleSignOffChange('sgaRepresentative', 'signature', signatureData);
  };

  const handleClientSignatureChange = () => {
    const signatureData = clientSignaturePadRef.current?.toDataURL() || '';
    handleSignOffChange('clientRepresentative', 'signature', signatureData);
  };

  const handleClearSgaSignature = () => {
    if (window.confirm("Clear SGA representative's signature?")) {
      sgaSignaturePadRef.current?.clear();
      handleSignOffChange('sgaRepresentative', 'signature', '');
    }
  };

  const handleClearClientSignature = () => {
    if (window.confirm("Clear client representative's signature?")) {
      clientSignaturePadRef.current?.clear();
      handleSignOffChange('clientRepresentative', 'signature', '');
    }
  };

  return (
    <div className="p-6 space-y-6 bg-white border border-gray-200 rounded-lg shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-sga-700">
            ITR - Asphalt Laying Inspection Report
          </h3>
          <p className="text-sm text-gray-500">SGA-QA-ITR-002</p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <p>Hold Point (H)</p>
          <p>Witness Point (W)</p>
        </div>
      </div>

      {/* Project Details */}
      <div className="p-4 space-y-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-semibold">Project Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label htmlFor="itr-projectName" className={formStyles.label}>
              Project Name
            </label>
            <input
              id="itr-projectName"
              type="text"
              name="projectName"
              value={data.projectName || job.projectName}
              onChange={handleChange}
              className={formStyles.input}
            />
          </div>
          <div>
            <label htmlFor="itr-client" className={formStyles.label}>
              Client
            </label>
            <input
              id="itr-client"
              type="text"
              name="client"
              value={data.client || job.client}
              onChange={handleChange}
              className={formStyles.input}
            />
          </div>
          <div>
            <label htmlFor="itr-projectDocNo" className={formStyles.label}>
              Project Doc No
            </label>
            <input
              id="itr-projectDocNo"
              type="text"
              name="projectDocNo"
              value={data.projectDocNo}
              onChange={handleChange}
              className={formStyles.input}
            />
          </div>
          <div className="lg:col-span-2">
            <label htmlFor="itr-description" className={formStyles.label}>
              Description
            </label>
            <input
              id="itr-description"
              type="text"
              name="description"
              value={data.description}
              onChange={handleChange}
              className={formStyles.input}
            />
          </div>
          <div>
            <label htmlFor="itr-dateLaid" className={formStyles.label}>
              Date Laid
            </label>
            <input
              id="itr-dateLaid"
              type="date"
              name="dateLaid"
              value={data.dateLaid || job.jobDate}
              onChange={handleChange}
              className={formStyles.input}
            />
          </div>
          <div>
            <label htmlFor="itr-lotNumber" className={formStyles.label}>
              Lot Number
            </label>
            <input
              id="itr-lotNumber"
              type="text"
              name="lotNumber"
              value={data.lotNumber}
              onChange={handleChange}
              className={formStyles.input}
            />
          </div>
          <div>
            <label htmlFor="itr-workArea" className={formStyles.label}>
              Work Area
            </label>
            <input
              id="itr-workArea"
              type="text"
              name="workArea"
              value={data.workArea}
              onChange={handleChange}
              className={formStyles.input}
            />
          </div>
          <div>
            <label htmlFor="itr-chainage" className={formStyles.label}>
              Chainage
            </label>
            <input
              id="itr-chainage"
              type="text"
              name="chainage"
              value={data.chainage}
              onChange={handleChange}
              className={formStyles.input}
              placeholder="e.g., CH 0+000 to CH 1+500"
            />
          </div>
        </div>
      </div>

      {/* Inspection Items Table */}
      <div className="space-y-4">
        <h4 className="font-semibold">Inspection Items</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-2 text-xs font-medium text-gray-700 border-b border-r w-8">
                  #
                </th>
                <th className="px-2 py-2 text-xs font-medium text-gray-700 border-b border-r text-left min-w-[200px]">
                  Activity / Task
                </th>
                <th className="px-2 py-2 text-xs font-medium text-gray-700 border-b border-r text-left min-w-[180px]">
                  Acceptance Criteria
                </th>
                <th className="px-2 py-2 text-xs font-medium text-gray-700 border-b border-r w-20">
                  Status
                </th>
                <th
                  className="px-1 py-2 text-xs font-medium text-gray-700 border-b border-r text-center"
                  colSpan={4}
                >
                  Hold Point Sign Off
                </th>
                <th className="px-2 py-2 text-xs font-medium text-gray-700 border-b text-left min-w-[120px]">
                  Comments
                </th>
              </tr>
              <tr className="bg-gray-50">
                <th className="border-b border-r"></th>
                <th className="border-b border-r"></th>
                <th className="border-b border-r"></th>
                <th className="border-b border-r"></th>
                <th className="px-1 py-1 text-xs font-medium text-gray-600 border-b border-r w-12 text-center">
                  SGA
                </th>
                <th className="px-1 py-1 text-xs font-medium text-gray-600 border-b border-r w-12 text-center">
                  DTI
                </th>
                <th className="px-1 py-1 text-xs font-medium text-gray-600 border-b border-r w-12 text-center">
                  GHD
                </th>
                <th className="px-1 py-1 text-xs font-medium text-gray-600 border-b border-r w-12 text-center">
                  Client
                </th>
                <th className="border-b"></th>
              </tr>
            </thead>
            <tbody>
              {data.inspectionItems.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-2 py-2 text-sm text-gray-700 border-b border-r text-center">
                    {item.itemNo}
                  </td>
                  <td className="px-2 py-2 text-sm text-gray-700 border-b border-r">
                    {item.description}
                  </td>
                  <td className="px-2 py-2 text-xs text-gray-600 border-b border-r">
                    {item.acceptanceCriteria}
                  </td>
                  <td className="px-2 py-2 border-b border-r">
                    <select
                      value={item.status}
                      onChange={(e) =>
                        handleInspectionItemChange(
                          index,
                          'status',
                          e.target.value as 'Yes' | 'No' | 'N/A' | ''
                        )
                      }
                      className="w-full px-1 py-1 text-sm border border-gray-300 rounded"
                    >
                      <option value="">--</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </td>
                  <td className="px-1 py-2 border-b border-r text-center">
                    <input
                      type="checkbox"
                      checked={item.holdPointSignOff.sga}
                      onChange={(e) =>
                        handleHoldPointChange(index, 'sga', e.target.checked)
                      }
                      className={formStyles.checkbox}
                    />
                  </td>
                  <td className="px-1 py-2 border-b border-r text-center">
                    <input
                      type="checkbox"
                      checked={item.holdPointSignOff.dti || false}
                      onChange={(e) =>
                        handleHoldPointChange(index, 'dti', e.target.checked)
                      }
                      className={formStyles.checkbox}
                    />
                  </td>
                  <td className="px-1 py-2 border-b border-r text-center">
                    <input
                      type="checkbox"
                      checked={item.holdPointSignOff.ghd || false}
                      onChange={(e) =>
                        handleHoldPointChange(index, 'ghd', e.target.checked)
                      }
                      className={formStyles.checkbox}
                    />
                  </td>
                  <td className="px-1 py-2 border-b border-r text-center">
                    <input
                      type="checkbox"
                      checked={item.holdPointSignOff.client || false}
                      onChange={(e) =>
                        handleHoldPointChange(index, 'client', e.target.checked)
                      }
                      className={formStyles.checkbox}
                    />
                  </td>
                  <td className="px-2 py-2 border-b">
                    <input
                      type="text"
                      value={item.comments}
                      onChange={(e) =>
                        handleInspectionItemChange(index, 'comments', e.target.value)
                      }
                      className="w-full px-1 py-1 text-sm border border-gray-300 rounded"
                      placeholder="Comments..."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* General Comments */}
      <div>
        <label htmlFor="itr-comments" className={formStyles.label}>
          General Comments
        </label>
        <textarea
          id="itr-comments"
          name="comments"
          value={data.comments}
          onChange={handleChange}
          rows={3}
          className={formStyles.input}
          placeholder="Enter any additional comments or observations..."
        />
      </div>

      {/* Sign Off Section */}
      <div className="p-4 space-y-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-lg font-semibold text-sga-700">Sign Off</h4>

        {/* SGA Representative */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h5 className="font-semibold text-gray-700 mb-3">SGA Representative</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={formStyles.label}>Name</label>
              <input
                type="text"
                value={data.sgaRepresentative.name}
                onChange={(e) =>
                  handleSignOffChange('sgaRepresentative', 'name', e.target.value)
                }
                className={formStyles.input}
              />
            </div>
            <div>
              <label className={formStyles.label}>Position</label>
              <input
                type="text"
                value={data.sgaRepresentative.position}
                onChange={(e) =>
                  handleSignOffChange('sgaRepresentative', 'position', e.target.value)
                }
                className={formStyles.input}
              />
            </div>
            <div>
              <label className={formStyles.label}>Date</label>
              <input
                type="date"
                value={data.sgaRepresentative.date}
                onChange={(e) =>
                  handleSignOffChange('sgaRepresentative', 'date', e.target.value)
                }
                className={formStyles.input}
              />
            </div>
            <div>
              <label className={formStyles.label}>Signature</label>
              <div onMouseUp={handleSgaSignatureChange} onTouchEnd={handleSgaSignatureChange}>
                <SignaturePad
                  ref={sgaSignaturePadRef}
                  initialSignature={data.sgaRepresentative.signature}
                />
              </div>
              <button
                onClick={handleClearSgaSignature}
                className="w-full mt-1 px-2 py-1 text-xs text-white bg-gray-600 rounded hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Client Representative */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h5 className="font-semibold text-gray-700 mb-3">Client Representative</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={formStyles.label}>Name</label>
              <input
                type="text"
                value={data.clientRepresentative.name}
                onChange={(e) =>
                  handleSignOffChange('clientRepresentative', 'name', e.target.value)
                }
                className={formStyles.input}
              />
            </div>
            <div>
              <label className={formStyles.label}>Position</label>
              <input
                type="text"
                value={data.clientRepresentative.position}
                onChange={(e) =>
                  handleSignOffChange('clientRepresentative', 'position', e.target.value)
                }
                className={formStyles.input}
              />
            </div>
            <div>
              <label className={formStyles.label}>Date</label>
              <input
                type="date"
                value={data.clientRepresentative.date}
                onChange={(e) =>
                  handleSignOffChange('clientRepresentative', 'date', e.target.value)
                }
                className={formStyles.input}
              />
            </div>
            <div>
              <label className={formStyles.label}>Signature</label>
              <div
                onMouseUp={handleClientSignatureChange}
                onTouchEnd={handleClientSignatureChange}
              >
                <SignaturePad
                  ref={clientSignaturePadRef}
                  initialSignature={data.clientRepresentative.signature}
                />
              </div>
              <button
                onClick={handleClearClientSignature}
                className="w-full mt-1 px-2 py-1 text-xs text-white bg-gray-600 rounded hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItrAsphaltLayingForm;
