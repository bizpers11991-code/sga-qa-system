import React, { useState, useEffect } from 'react';
import { ItpChecklistData } from '../../types';
import VoiceInput from '../common/VoiceInput';

interface ItpChecklistFormProps {
  initialData: ItpChecklistData;
  onUpdate: (data: ItpChecklistData) => void;
}

const formStyles = {
  input:
    'w-full px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sga-500 focus:border-sga-500',
  select:
    'px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sga-500 focus:border-sga-500',
};

export const ItpChecklistForm: React.FC<ItpChecklistFormProps> = ({ initialData, onUpdate }) => {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    onUpdate(data);
  }, [data, onUpdate]);

  const handleItemChange = (sectionIndex: number, itemIndex: number, name: string, value: string) => {
    const newData = JSON.parse(JSON.stringify(data)); // Deep copy
    newData.sections[sectionIndex].items[itemIndex][name] = value;
    setData(newData);
  };

  return (
    <div className="p-6 space-y-6 bg-white border border-gray-200 rounded-lg shadow-md">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-sga-700">Inspection and Test Plan (ITP) Checklist</h3>
        {data.documentId && <span className="text-sm font-semibold text-gray-500">{data.documentId}</span>}
      </div>

      <div className="space-y-6">
        {data.sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="p-4 bg-white border border-gray-200 rounded-lg">
            <h4 className="text-lg font-semibold text-sga-700">{section.title}</h4>
            <div className="mt-4 space-y-3">
              {section.items.map((item, itemIndex) => (
                <div
                  key={item.id}
                  className={`p-3 border border-gray-200 rounded-md ${
                    item.isWitnessPoint ? 'bg-yellow-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="grid items-start grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="md:col-span-1">
                      <label className="text-sm font-medium text-gray-700">{item.description}</label>
                      {item.isWitnessPoint && (
                        <p className="text-xs font-bold text-yellow-700">CLIENT WITNESS POINT</p>
                      )}
                    </div>
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <select
                        name="compliant"
                        value={item.compliant}
                        onChange={(e) => handleItemChange(sectionIndex, itemIndex, e.target.name, e.target.value)}
                        className={`${formStyles.select} w-28`}
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="N/A">N/A</option>
                      </select>
                      <VoiceInput
                        onTextChange={(text) => handleItemChange(sectionIndex, itemIndex, 'comments', text)}
                        currentValue={item.comments}
                      >
                        <input
                          type="text"
                          name="comments"
                          placeholder="Comments..."
                          value={item.comments}
                          onChange={(e) => handleItemChange(sectionIndex, itemIndex, e.target.name, e.target.value)}
                          className={`${formStyles.input} flex-grow`}
                        />
                      </VoiceInput>
                    </div>
                  </div>
                  {item.isWitnessPoint && (
                    <div className="mt-2 pl-4 border-l-4 border-yellow-400">
                      <label className="text-xs font-medium text-gray-600">Witness Name</label>
                      <input
                        type="text"
                        name="witnessName"
                        placeholder="Enter client witness name..."
                        value={item.witnessName}
                        onChange={(e) => handleItemChange(sectionIndex, itemIndex, e.target.name, e.target.value)}
                        className={`${formStyles.input} mt-1`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ItpChecklistForm;
