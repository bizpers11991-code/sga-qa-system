// components/reports/ReportPreview.tsx

import { DailyJobSheetData } from '../../types';

interface ReportPreviewProps {
  data: DailyJobSheetData;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

const ReportPreview = ({ data, isOpen, onClose, onSubmit, isSubmitting = false }: ReportPreviewProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                  Review Your Report
                </h3>

                <div className="mt-2 max-h-[60vh] overflow-y-auto">
                  {/* Job Information */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-sga-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Job Information
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Job No:</span>
                        <span className="ml-2 text-gray-900">{data.jobNo || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Client:</span>
                        <span className="ml-2 text-gray-900">{data.client || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Date:</span>
                        <span className="ml-2 text-gray-900">{data.date || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Shift:</span>
                        <span className="ml-2 text-gray-900">{data.dayShift ? 'Day' : 'Night'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium text-gray-700">Project:</span>
                        <span className="ml-2 text-gray-900">{data.projectName || 'N/A'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium text-gray-700">Address:</span>
                        <span className="ml-2 text-gray-900">{data.address || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Foreman:</span>
                        <span className="ml-2 text-gray-900">{data.asphaltForeman || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Materials */}
                  {data.jobMaterials && data.jobMaterials.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                        <svg className="h-5 w-5 mr-2 text-sga-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Materials ({data.jobMaterials.length})
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-white">
                            <tr>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">Mix Code</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">Binder</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">Area</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">Tonnes</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">Layer</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {data.jobMaterials.map((material, index) => (
                              <tr key={index}>
                                <td className="px-2 py-2 text-gray-900">{material.mixCode}</td>
                                <td className="px-2 py-2 text-gray-900">{material.binder}</td>
                                <td className="px-2 py-2 text-gray-900">{material.area} m&sup2;</td>
                                <td className="px-2 py-2 text-gray-900">{material.tonnes} t</td>
                                <td className="px-2 py-2 text-gray-900">{material.layerNo}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Equipment */}
                  {data.equipment && data.equipment.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                        <svg className="h-5 w-5 mr-2 text-sga-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                        Equipment ({data.equipment.length})
                      </h4>
                      <div className="space-y-2">
                        {data.equipment.map((eq, index) => (
                          <div key={index} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                            <span className="font-medium text-gray-900">{eq.item}</span>
                            <span className="text-gray-600">{eq.vehicle} - {eq.fleetNo}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Photos */}
                  {data.jobSheetImages && data.jobSheetImages.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                        <svg className="h-5 w-5 mr-2 text-sga-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Photos ({data.jobSheetImages.length})
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {data.jobSheetImages.slice(0, 6).map((photo, index) => (
                          <div key={index} className="aspect-w-16 aspect-h-9 bg-gray-200 rounded overflow-hidden">
                            <img
                              src={photo.data}
                              alt={photo.name || `Photo ${index + 1}`}
                              className="object-cover w-full h-24"
                            />
                          </div>
                        ))}
                      </div>
                      {data.jobSheetImages.length > 6 && (
                        <p className="text-xs text-gray-500 mt-2">
                          + {data.jobSheetImages.length - 6} more photos
                        </p>
                      )}
                    </div>
                  )}

                  {/* Additional Details */}
                  {data.jobDetails && data.jobDetails.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                        <svg className="h-5 w-5 mr-2 text-sga-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Job Details
                      </h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {data.jobDetails.map((detail, index) => (
                          <li key={index}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-3 bg-sga-600 text-base font-medium text-white hover:bg-sga-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sga-500 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Looks good, submit'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sga-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              Go back and edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPreview;
