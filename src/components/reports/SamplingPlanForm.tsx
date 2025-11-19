// components/reports/SamplingPlanForm.tsx

import { useState } from 'react';
import { SamplingPlan } from '../../types';
import { generateCoreLocations, CoreLocationParams } from '../../services/reportsApi';

interface SamplingPlanFormProps {
  jobNo: string;
  onSave: (plan: SamplingPlan) => void;
  disabled?: boolean;
}

const SamplingPlanForm = ({ jobNo, onSave, disabled = false }: SamplingPlanFormProps) => {
  const [formData, setFormData] = useState<Partial<CoreLocationParams>>({
    jobNo,
    lotNo: '',
    specification: '',
    startChainage: 0,
    endChainage: 0,
    numCores: 3,
  });

  const [samplingPlan, setSamplingPlan] = useState<SamplingPlan | null>(null);
  const [testResults, setTestResults] = useState<{ [key: number]: { notes: string; passFail: 'Pass' | 'Fail' | '' } }>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof CoreLocationParams, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenerateCoreLocations = async () => {
    if (!formData.lotNo || !formData.specification || !formData.startChainage || !formData.endChainage || !formData.numCores) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.endChainage <= formData.startChainage) {
      setError('End chainage must be greater than start chainage');
      return;
    }

    if (formData.numCores < 1) {
      setError('Number of cores must be at least 1');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const plan = await generateCoreLocations(formData as CoreLocationParams);
      setSamplingPlan(plan);

      // Initialize test results
      const initialResults: { [key: number]: { notes: string; passFail: 'Pass' | 'Fail' | '' } } = {};
      plan.results.forEach((_, index) => {
        initialResults[index] = { notes: '', passFail: '' };
      });
      setTestResults(initialResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate core locations');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTestResultChange = (index: number, field: 'notes' | 'passFail', value: string) => {
    setTestResults(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    if (!samplingPlan) return;

    // Update sampling plan with test results
    const updatedPlan: SamplingPlan = {
      ...samplingPlan,
      results: samplingPlan.results.map((result, index) => ({
        ...result,
        notes: testResults[index]?.notes || result.notes,
      })),
    };

    onSave(updatedPlan);
  };

  const getPassFailCount = () => {
    const counts = { pass: 0, fail: 0, pending: 0 };
    Object.values(testResults).forEach(result => {
      if (result.passFail === 'Pass') counts.pass++;
      else if (result.passFail === 'Fail') counts.fail++;
      else counts.pending++;
    });
    return counts;
  };

  const counts = samplingPlan ? getPassFailCount() : null;

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Sampling Plan Parameters</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lot Number *
              </label>
              <input
                type="text"
                value={formData.lotNo}
                onChange={(e) => handleInputChange('lotNo', e.target.value)}
                disabled={disabled || isGenerating}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sga-500 focus:ring-sga-500 sm:text-sm"
                placeholder="LOT-2024-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Specification *
              </label>
              <input
                type="text"
                value={formData.specification}
                onChange={(e) => handleInputChange('specification', e.target.value)}
                disabled={disabled || isGenerating}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sga-500 focus:ring-sga-500 sm:text-sm"
                placeholder="AS2150-2005"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Start Chainage (m) *
              </label>
              <input
                type="number"
                value={formData.startChainage}
                onChange={(e) => handleInputChange('startChainage', parseFloat(e.target.value) || 0)}
                disabled={disabled || isGenerating}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sga-500 focus:ring-sga-500 sm:text-sm"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                End Chainage (m) *
              </label>
              <input
                type="number"
                value={formData.endChainage}
                onChange={(e) => handleInputChange('endChainage', parseFloat(e.target.value) || 0)}
                disabled={disabled || isGenerating}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sga-500 focus:ring-sga-500 sm:text-sm"
                placeholder="1000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Number of Cores *
              </label>
              <input
                type="number"
                min="1"
                value={formData.numCores}
                onChange={(e) => handleInputChange('numCores', parseInt(e.target.value) || 0)}
                disabled={disabled || isGenerating}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sga-500 focus:ring-sga-500 sm:text-sm"
                placeholder="3"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5">
            <button
              type="button"
              onClick={handleGenerateCoreLocations}
              disabled={disabled || isGenerating}
              className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sga-600 hover:bg-sga-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sga-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Generate Core Locations
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Core Locations Grid */}
      {samplingPlan && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Core Locations</h3>
              {counts && (
                <div className="flex gap-3 text-sm">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-green-100 text-green-800">
                    Pass: {counts.pass}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-red-100 text-red-800">
                    Fail: {counts.fail}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-800">
                    Pending: {counts.pending}
                  </span>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-sga-700">
                  <tr>
                    <th scope="col" className="py-3 px-3 text-left text-xs font-semibold text-white uppercase">
                      Core #
                    </th>
                    <th scope="col" className="py-3 px-3 text-left text-xs font-semibold text-white uppercase">
                      Chainage (m)
                    </th>
                    <th scope="col" className="py-3 px-3 text-left text-xs font-semibold text-white uppercase">
                      Offset
                    </th>
                    <th scope="col" className="py-3 px-3 text-left text-xs font-semibold text-white uppercase">
                      Notes
                    </th>
                    <th scope="col" className="py-3 px-3 text-left text-xs font-semibold text-white uppercase">
                      Result
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {samplingPlan.results.map((result, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-3 px-3 text-sm font-medium text-gray-900">
                        Core {index + 1}
                      </td>
                      <td className="whitespace-nowrap py-3 px-3 text-sm text-gray-900">
                        {result.chainage.toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap py-3 px-3 text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          result.offset === 'LWP' ? 'bg-blue-100 text-blue-800' :
                          result.offset === 'RWP' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {result.offset}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={testResults[index]?.notes || ''}
                          onChange={(e) => handleTestResultChange(index, 'notes', e.target.value)}
                          disabled={disabled}
                          placeholder="Enter test notes"
                          className="block w-full min-w-[200px] rounded-md border-gray-300 shadow-sm focus:border-sga-500 focus:ring-sga-500 sm:text-sm"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={testResults[index]?.passFail || ''}
                          onChange={(e) => handleTestResultChange(index, 'passFail', e.target.value)}
                          disabled={disabled}
                          className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-sga-500 focus:ring-sga-500 sm:text-sm ${
                            testResults[index]?.passFail === 'Pass' ? 'bg-green-50 text-green-900' :
                            testResults[index]?.passFail === 'Fail' ? 'bg-red-50 text-red-900' :
                            ''
                          }`}
                        >
                          <option value="">Pending</option>
                          <option value="Pass">Pass</option>
                          <option value="Fail">Fail</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={disabled}
                className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sga-600 hover:bg-sga-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sga-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                Save Sampling Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="rounded-md bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">How it works</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>The AI will generate evenly spaced core locations based on your parameters. Core locations are distributed across the wheelpath (LWP, RWP, Between WP) for representative sampling.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SamplingPlanForm;
