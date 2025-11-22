import React, { useState, useEffect } from 'react';
import type { PreStartChecklistData, PreStartChecklistItem } from '../../types';

interface PreStartChecklistFormProps {
  initialData: PreStartChecklistData;
  onUpdate: (data: PreStartChecklistData) => void;
}

const formStyles = {
  input: "w-full px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200",
  label: "block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300",
  select: "px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200",
  button: "px-3 py-1 text-sm font-semibold text-white bg-amber-600 rounded-md hover:bg-amber-700"
};

const DEFAULT_CHECKLIST_ITEMS: PreStartChecklistItem[] = [
  { id: '1', item: 'Vehicle/Equipment ID verified', status: '', comment: '' },
  { id: '2', item: 'Fluid levels checked (oil, coolant, hydraulic)', status: '', comment: '' },
  { id: '3', item: 'Tire/track condition inspected', status: '', comment: '' },
  { id: '4', item: 'Lights and indicators functional', status: '', comment: '' },
  { id: '5', item: 'Brakes tested', status: '', comment: '' },
  { id: '6', item: 'Safety equipment present (fire extinguisher, first aid)', status: '', comment: '' },
  { id: '7', item: 'No visible leaks or damage', status: '', comment: '' },
  { id: '8', item: 'Cleanliness and housekeeping acceptable', status: '', comment: '' },
];

const PreStartChecklistForm: React.FC<PreStartChecklistFormProps> = ({ initialData, onUpdate }) => {
  const [data, setData] = useState<PreStartChecklistData>({
    vehicleId: initialData.vehicleId || '',
    prestartCompletedBy: initialData.prestartCompletedBy || '',
    items: initialData.items?.length > 0 ? initialData.items : DEFAULT_CHECKLIST_ITEMS
  });

  useEffect(() => {
    onUpdate(data);
  }, [data, onUpdate]);

  const handleChange = (field: keyof PreStartChecklistData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof PreStartChecklistItem, value: string) => {
    const updatedItems = [...data.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setData(prev => ({ ...prev, items: updatedItems }));
  };

  const addItem = () => {
    const newItem: PreStartChecklistItem = {
      id: `custom-${Date.now()}`,
      item: '',
      status: '',
      comment: ''
    };
    setData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeItem = (index: number) => {
    setData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  return (
    <div className="p-6 space-y-6 bg-white border border-gray-200 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
      <h3 className="text-xl font-bold text-amber-600">Pre-Start Checklist</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 border rounded-lg dark:bg-gray-900/50 dark:border-gray-700">
        <div>
          <label className={formStyles.label}>Vehicle/Equipment ID</label>
          <input
            type="text"
            value={data.vehicleId}
            onChange={(e) => handleChange('vehicleId', e.target.value)}
            className={formStyles.input}
            placeholder="e.g., TRUCK-001"
          />
        </div>
        <div>
          <label className={formStyles.label}>Pre-Start Completed By</label>
          <input
            type="text"
            value={data.prestartCompletedBy}
            onChange={(e) => handleChange('prestartCompletedBy', e.target.value)}
            className={formStyles.input}
            placeholder="Name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-gray-700 dark:text-gray-300">Checklist Items</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="p-2 text-left">Item</th>
                <th className="p-2 text-left w-32">Status</th>
                <th className="p-2 text-left">Comments</th>
                <th className="p-2 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={item.id} className="border-b dark:border-gray-600">
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.item}
                      onChange={(e) => handleItemChange(index, 'item', e.target.value)}
                      className={formStyles.input}
                      placeholder="Checklist item..."
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={item.status}
                      onChange={(e) => handleItemChange(index, 'status', e.target.value)}
                      className={formStyles.select}
                    >
                      <option value="">-</option>
                      <option value="Pass">Pass</option>
                      <option value="Fail">Fail</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.comment}
                      onChange={(e) => handleItemChange(index, 'comment', e.target.value)}
                      className={formStyles.input}
                      placeholder="Comments..."
                    />
                  </td>
                  <td className="p-2">
                    {item.id.startsWith('custom-') && (
                      <button
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-700 font-bold"
                        type="button"
                      >
                        &times;
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={addItem} className={formStyles.button} type="button">
          + Add Custom Item
        </button>
      </div>
    </div>
  );
};

export default PreStartChecklistForm;
