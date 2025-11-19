import React, { useState, useEffect } from 'react';
import { SiteRecordData } from '../../types';

interface SiteRecordFormProps {
  initialData: SiteRecordData;
  onUpdate: (data: SiteRecordData) => void;
}

const formStyles = {
  input:
    'w-full px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sga-500 focus:border-sga-500',
  label: 'block text-sm font-medium text-gray-700 mb-1',
  button: 'px-3 py-1 text-sm font-semibold text-white bg-sga-700 rounded-md hover:bg-sga-800',
  removeButton: 'px-2 py-1 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700',
};

export const SiteRecordForm: React.FC<SiteRecordFormProps> = ({ initialData, onUpdate }) => {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    onUpdate(data);
  }, [data, onUpdate]);

  const handleTableRowChange = (
    section: 'hazardLog' | 'siteVisitors',
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const list = [...data[section]];
    (list[index] as any)[name] = value;
    setData((prev) => ({ ...prev, [section]: list }));
  };

  const addRow = (section: 'hazardLog' | 'siteVisitors') => {
    let newRow;
    if (section === 'hazardLog') newRow = { hazardDescription: '', controlMeasures: '' };
    else newRow = { name: '', company: '', timeIn: '', timeOut: '' };
    setData((prev) => ({ ...prev, [section]: [...prev[section], newRow] }));
  };

  const removeRow = (section: 'hazardLog' | 'siteVisitors', index: number) => {
    const list = data[section].filter((_, i) => i !== index);
    setData((prev) => ({ ...prev, [section]: list }));
  };

  return (
    <div className="p-6 space-y-6 bg-white border border-gray-200 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-sga-700">Daily Site Record</h3>

      {/* Hazard Log */}
      <div className="space-y-2">
        <h4 className="font-semibold">Hazard Log (New hazards identified on site today)</h4>
        {data.hazardLog.map((row, index) => (
          <div
            key={index}
            className="grid items-end grid-cols-1 md:grid-cols-3 gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md"
          >
            <div className="md:col-span-2 grid grid-cols-2 gap-2">
              <div>
                <label htmlFor={`hazard-desc-${index}`} className={formStyles.label}>
                  Hazard Description
                </label>
                <input
                  id={`hazard-desc-${index}`}
                  name="hazardDescription"
                  value={row.hazardDescription}
                  onChange={(e) => handleTableRowChange('hazardLog', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label htmlFor={`hazard-controls-${index}`} className={formStyles.label}>
                  Control Measures
                </label>
                <input
                  id={`hazard-controls-${index}`}
                  name="controlMeasures"
                  value={row.controlMeasures}
                  onChange={(e) => handleTableRowChange('hazardLog', index, e)}
                  className={formStyles.input}
                />
              </div>
            </div>
            <div className="text-right">
              <button onClick={() => removeRow('hazardLog', index)} className={formStyles.removeButton}>
                Remove
              </button>
            </div>
          </div>
        ))}
        <button onClick={() => addRow('hazardLog')} className={formStyles.button}>
          + Add Hazard
        </button>
      </div>

      {/* Site Visitors */}
      <div className="space-y-2">
        <h4 className="font-semibold">Site Visitors Log</h4>
        {data.siteVisitors.map((row, index) => (
          <div
            key={index}
            className="grid items-end grid-cols-1 md:grid-cols-5 gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md"
          >
            <div className="md:col-span-4 grid grid-cols-4 gap-2">
              <div>
                <label htmlFor={`visitor-name-${index}`} className={formStyles.label}>
                  Name
                </label>
                <input
                  id={`visitor-name-${index}`}
                  name="name"
                  value={row.name}
                  onChange={(e) => handleTableRowChange('siteVisitors', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label htmlFor={`visitor-company-${index}`} className={formStyles.label}>
                  Company
                </label>
                <input
                  id={`visitor-company-${index}`}
                  name="company"
                  value={row.company}
                  onChange={(e) => handleTableRowChange('siteVisitors', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label htmlFor={`visitor-timein-${index}`} className={formStyles.label}>
                  Time In
                </label>
                <input
                  id={`visitor-timein-${index}`}
                  type="time"
                  name="timeIn"
                  value={row.timeIn}
                  onChange={(e) => handleTableRowChange('siteVisitors', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label htmlFor={`visitor-timeout-${index}`} className={formStyles.label}>
                  Time Out
                </label>
                <input
                  id={`visitor-timeout-${index}`}
                  type="time"
                  name="timeOut"
                  value={row.timeOut}
                  onChange={(e) => handleTableRowChange('siteVisitors', index, e)}
                  className={formStyles.input}
                />
              </div>
            </div>
            <div className="text-right">
              <button onClick={() => removeRow('siteVisitors', index)} className={formStyles.removeButton}>
                Remove
              </button>
            </div>
          </div>
        ))}
        <button onClick={() => addRow('siteVisitors')} className={formStyles.button}>
          + Add Visitor
        </button>
      </div>
    </div>
  );
};

export default SiteRecordForm;
