// components/reports/MaterialsTable.tsx

import { useState } from 'react';
import { JobMaterial } from '../../types';

interface MaterialsTableProps {
  materials: JobMaterial[];
  onChange: (materials: JobMaterial[]) => void;
  disabled?: boolean;
}

const emptyMaterial: JobMaterial = {
  mixCode: '',
  binder: '',
  additive: '',
  density: 0,
  aveDepth: 0,
  area: '',
  tonnes: 0,
  layerNo: 1,
  pavementType: '',
  lotNumber: '',
};

const MaterialsTable = ({ materials, onChange, disabled = false }: MaterialsTableProps) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleAddRow = () => {
    onChange([...materials, { ...emptyMaterial }]);
  };

  const handleRemoveRow = (index: number) => {
    const newMaterials = materials.filter((_, i) => i !== index);
    onChange(newMaterials);
  };

  const handleFieldChange = (index: number, field: keyof JobMaterial, value: string | number) => {
    const newMaterials = [...materials];
    newMaterials[index] = {
      ...newMaterials[index],
      [field]: value,
    };
    onChange(newMaterials);

    // Validate field
    validateField(index, field, value);
  };

  const validateField = (index: number, field: keyof JobMaterial, value: string | number) => {
    const errorKey = `${index}-${field}`;
    const newErrors = { ...errors };

    // Remove error if field is valid
    if (value !== '' && value !== 0) {
      delete newErrors[errorKey];
    } else if (field !== 'additive' && field !== 'lotNumber') {
      // Required fields (except optional ones)
      newErrors[errorKey] = 'Required';
    }

    setErrors(newErrors);
  };

  const calculateTotals = () => {
    const totalArea = materials.reduce((sum, m) => sum + (parseFloat(m.area) || 0), 0);
    const totalTonnes = materials.reduce((sum, m) => sum + (m.tonnes || 0), 0);
    return { totalArea, totalTonnes };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-sga-700">
                <tr>
                  <th scope="col" className="py-3 px-3 text-left text-xs font-semibold text-white uppercase">
                    Mix Code
                  </th>
                  <th scope="col" className="py-3 px-3 text-left text-xs font-semibold text-white uppercase">
                    Binder
                  </th>
                  <th scope="col" className="py-3 px-3 text-left text-xs font-semibold text-white uppercase">
                    Additive
                  </th>
                  <th scope="col" className="py-3 px-3 text-left text-xs font-semibold text-white uppercase">
                    Density
                  </th>
                  <th scope="col" className="py-3 px-3 text-left text-xs font-semibold text-white uppercase">
                    Depth (mm)
                  </th>
                  <th scope="col" className="py-3 px-3 text-left text-xs font-semibold text-white uppercase">
                    Area (m&sup2;)
                  </th>
                  <th scope="col" className="py-3 px-3 text-left text-xs font-semibold text-white uppercase">
                    Tonnes
                  </th>
                  <th scope="col" className="py-3 px-3 text-left text-xs font-semibold text-white uppercase">
                    Layer #
                  </th>
                  <th scope="col" className="py-3 px-3 text-left text-xs font-semibold text-white uppercase">
                    Type
                  </th>
                  <th scope="col" className="py-3 px-3 text-left text-xs font-semibold text-white uppercase">
                    Lot #
                  </th>
                  <th scope="col" className="relative py-3 px-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {materials.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-3 py-8 text-center text-sm text-gray-500">
                      No materials added yet. Click "Add Row" to start.
                    </td>
                  </tr>
                )}
                {materials.map((material, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-2 px-3">
                      <input
                        type="text"
                        value={material.mixCode}
                        onChange={(e) => handleFieldChange(index, 'mixCode', e.target.value)}
                        disabled={disabled}
                        className={`block w-full min-w-[120px] rounded border-gray-300 shadow-sm focus:border-sga-500 focus:ring-sga-500 sm:text-sm ${
                          errors[`${index}-mixCode`] ? 'border-red-300' : ''
                        }`}
                        placeholder="AC10"
                      />
                    </td>
                    <td className="whitespace-nowrap py-2 px-3">
                      <input
                        type="text"
                        value={material.binder}
                        onChange={(e) => handleFieldChange(index, 'binder', e.target.value)}
                        disabled={disabled}
                        className={`block w-full min-w-[100px] rounded border-gray-300 shadow-sm focus:border-sga-500 focus:ring-sga-500 sm:text-sm ${
                          errors[`${index}-binder`] ? 'border-red-300' : ''
                        }`}
                        placeholder="C320"
                      />
                    </td>
                    <td className="whitespace-nowrap py-2 px-3">
                      <input
                        type="text"
                        value={material.additive}
                        onChange={(e) => handleFieldChange(index, 'additive', e.target.value)}
                        disabled={disabled}
                        className="block w-full min-w-[100px] rounded border-gray-300 shadow-sm focus:border-sga-500 focus:ring-sga-500 sm:text-sm"
                        placeholder="Optional"
                      />
                    </td>
                    <td className="whitespace-nowrap py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={material.density || ''}
                        onChange={(e) => handleFieldChange(index, 'density', parseFloat(e.target.value) || 0)}
                        disabled={disabled}
                        className={`block w-full min-w-[80px] rounded border-gray-300 shadow-sm focus:border-sga-500 focus:ring-sga-500 sm:text-sm ${
                          errors[`${index}-density`] ? 'border-red-300' : ''
                        }`}
                        placeholder="2.35"
                      />
                    </td>
                    <td className="whitespace-nowrap py-2 px-3">
                      <input
                        type="number"
                        value={material.aveDepth || ''}
                        onChange={(e) => handleFieldChange(index, 'aveDepth', parseFloat(e.target.value) || 0)}
                        disabled={disabled}
                        className={`block w-full min-w-[80px] rounded border-gray-300 shadow-sm focus:border-sga-500 focus:ring-sga-500 sm:text-sm ${
                          errors[`${index}-aveDepth`] ? 'border-red-300' : ''
                        }`}
                        placeholder="40"
                      />
                    </td>
                    <td className="whitespace-nowrap py-2 px-3">
                      <input
                        type="text"
                        value={material.area}
                        onChange={(e) => handleFieldChange(index, 'area', e.target.value)}
                        disabled={disabled}
                        className={`block w-full min-w-[80px] rounded border-gray-300 shadow-sm focus:border-sga-500 focus:ring-sga-500 sm:text-sm ${
                          errors[`${index}-area`] ? 'border-red-300' : ''
                        }`}
                        placeholder="1000"
                      />
                    </td>
                    <td className="whitespace-nowrap py-2 px-3">
                      <input
                        type="number"
                        step="0.1"
                        value={material.tonnes || ''}
                        onChange={(e) => handleFieldChange(index, 'tonnes', parseFloat(e.target.value) || 0)}
                        disabled={disabled}
                        className={`block w-full min-w-[80px] rounded border-gray-300 shadow-sm focus:border-sga-500 focus:ring-sga-500 sm:text-sm ${
                          errors[`${index}-tonnes`] ? 'border-red-300' : ''
                        }`}
                        placeholder="94"
                      />
                    </td>
                    <td className="whitespace-nowrap py-2 px-3">
                      <input
                        type="number"
                        min="1"
                        value={material.layerNo || ''}
                        onChange={(e) => handleFieldChange(index, 'layerNo', parseInt(e.target.value) || 1)}
                        disabled={disabled}
                        className={`block w-full min-w-[60px] rounded border-gray-300 shadow-sm focus:border-sga-500 focus:ring-sga-500 sm:text-sm ${
                          errors[`${index}-layerNo`] ? 'border-red-300' : ''
                        }`}
                        placeholder="1"
                      />
                    </td>
                    <td className="whitespace-nowrap py-2 px-3">
                      <input
                        type="text"
                        value={material.pavementType}
                        onChange={(e) => handleFieldChange(index, 'pavementType', e.target.value)}
                        disabled={disabled}
                        className={`block w-full min-w-[100px] rounded border-gray-300 shadow-sm focus:border-sga-500 focus:ring-sga-500 sm:text-sm ${
                          errors[`${index}-pavementType`] ? 'border-red-300' : ''
                        }`}
                        placeholder="Wearing"
                      />
                    </td>
                    <td className="whitespace-nowrap py-2 px-3">
                      <input
                        type="text"
                        value={material.lotNumber}
                        onChange={(e) => handleFieldChange(index, 'lotNumber', e.target.value)}
                        disabled={disabled}
                        className="block w-full min-w-[80px] rounded border-gray-300 shadow-sm focus:border-sga-500 focus:ring-sga-500 sm:text-sm"
                        placeholder="Optional"
                      />
                    </td>
                    <td className="relative whitespace-nowrap py-2 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        disabled={disabled}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                        title="Remove row"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {materials.length > 0 && (
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={5} className="px-3 py-3 text-sm text-gray-900 text-right">
                      Totals:
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900">
                      {totals.totalArea.toFixed(2)} m&sup2;
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900">
                      {totals.totalTonnes.toFixed(2)} t
                    </td>
                    <td colSpan={4}></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAddRow}
        disabled={disabled}
        className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sga-600 hover:bg-sga-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sga-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
      >
        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Row
      </button>

      {Object.keys(errors).length > 0 && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Please fix validation errors</h3>
              <p className="text-sm text-red-700 mt-1">Some required fields are missing or invalid.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialsTable;
