import React, { useState, useEffect } from 'react';
import { SprayReportData, SpraySealRun } from '../../types';

const formStyles = {
    input: "w-full px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200",
    readOnlyInput: "w-full px-2 py-1 text-sm text-gray-700 bg-gray-200 border border-gray-300 rounded-md focus:outline-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400",
    label: "block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300",
    button: "px-3 py-1 text-sm font-semibold text-white bg-amber-600 rounded-md hover:bg-amber-700",
    removeButton: "px-2 py-1 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700"
};

interface SprayReportFormProps {
  initialData: SprayReportData;
  onUpdate: (data: SprayReportData) => void;
}

const SprayReportForm: React.FC<SprayReportFormProps> = ({ initialData, onUpdate }) => {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    onUpdate(data);
  }, [data, onUpdate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleRunChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedRuns = [...data.runs];
    let updatedRow = { ...updatedRuns[index], [name]: value };

    if (name === 'startChainage' || name === 'endChainage') {
        const start = parseFloat(updatedRow.startChainage);
        const end = parseFloat(updatedRow.endChainage);
        if (!isNaN(start) && !isNaN(end) && end >= start) {
            updatedRow.length = (end - start).toFixed(2);
        } else {
            updatedRow.length = '';
        }
    }

    const length = parseFloat(updatedRow.length);
    const width = parseFloat(updatedRow.width);
    if (!isNaN(length) && !isNaN(width)) {
        updatedRow.area = (length * width).toFixed(2);
    } else {
        updatedRow.area = '';
    }

    updatedRuns[index] = updatedRow;
    setData(prev => ({ ...prev, runs: updatedRuns }));
  };

  const addRun = () => {
    const newRun: SpraySealRun = { 
      runNo: String(data.runs.length + 1), 
      startChainage: '', 
      endChainage: '', 
      length: '', 
      width: '', 
      area: '', 
      volumeSprayedLitres: '', 
      comments: '' 
    };
    setData(prev => ({ ...prev, runs: [...prev.runs, newRun] }));
  };

  const removeRun = (index: number) => {
    const list = data.runs.filter((_, i) => i !== index);
    setData(prev => ({ ...prev, runs: list }));
  };

  return (
    <div className="p-6 space-y-6 bg-white border border-gray-200 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
      <h3 className="text-xl font-bold text-amber-600">Spray Seal Report</h3>
      
      <div className="p-4 space-y-4 bg-gray-50 border rounded-lg dark:bg-gray-900/50 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><label className={formStyles.label}>Lot No</label><input type="text" name="lotNo" value={data.lotNo} onChange={handleChange} className={formStyles.input} /></div>
          <div><label className={formStyles.label}>Date</label><input type="date" name="date" value={data.date} onChange={handleChange} className={formStyles.input} /></div>
          <div><label className={formStyles.label}>Crew Leader</label><input type="text" name="crewLeader" value={data.crewLeader} onChange={handleChange} className={formStyles.readOnlyInput} readOnly /></div>
          <div><label className={formStyles.label}>Operator</label><input type="text" name="operator" value={data.operator} onChange={handleChange} className={formStyles.input} /></div>
        </div>
      </div>
      
      <div className="p-4 space-y-4 bg-gray-50 border rounded-lg dark:bg-gray-900/50 dark:border-gray-700">
        <h4 className="font-semibold">Environmental Conditions</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className={formStyles.label}>Weather</label><input name="weather" value={data.weather} onChange={handleChange} className={formStyles.input} placeholder="e.g. Fine, Overcast"/></div>
            <div><label className={formStyles.label}>Wind Speed (km/h)</label><input type="number" name="windSpeed" value={data.windSpeed} onChange={handleChange} className={formStyles.input}/></div>
            <div><label className={formStyles.label}>Pavement Temp (°C)</label><input type="number" name="pavementTemp" value={data.pavementTemp} onChange={handleChange} className={formStyles.input}/></div>
            <div><label className={formStyles.label}>Air Temp (°C)</label><input type="number" name="airTemp" value={data.airTemp} onChange={handleChange} className={formStyles.input}/></div>
        </div>
      </div>

      <div className="p-4 space-y-4 bg-gray-50 border rounded-lg dark:bg-gray-900/50 dark:border-gray-700">
        <h4 className="font-semibold">Product & Application Details</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className={formStyles.label}>Product Type</label><input name="productType" value={data.productType} onChange={handleChange} className={formStyles.input} placeholder="e.g. C170, AMC00"/></div>
            <div><label className={formStyles.label}>Source</label><input name="source" value={data.source} onChange={handleChange} className={formStyles.input} placeholder="e.g. SAMI, Puma"/></div>
            <div><label className={formStyles.label}>Spray Rate Target (L/m²)</label><input type="number" name="sprayRateTarget" value={data.sprayRateTarget} onChange={handleChange} className={formStyles.input}/></div>
            <div><label className={formStyles.label}>Spray Rate Achieved (L/m²)</label><input type="number" name="sprayRateAchieved" value={data.sprayRateAchieved} onChange={handleChange} className={formStyles.input}/></div>
            <div><label className={formStyles.label}>Truck Readout Start (L)</label><input type="number" name="truckReadoutStart" value={data.truckReadoutStart} onChange={handleChange} className={formStyles.input}/></div>
            <div><label className={formStyles.label}>Truck Readout Finish (L)</label><input type="number" name="truckReadoutFinish" value={data.truckReadoutFinish} onChange={handleChange} className={formStyles.input}/></div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold">Spray Runs</h4>
        {data.runs.map((run, index) => (
          <div key={index} className="p-3 bg-gray-50 border rounded-md dark:bg-gray-900/50 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
                <h5 className="font-bold">Run #{run.runNo}</h5>
                <button onClick={() => removeRun(index)} className={formStyles.removeButton}>X</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div><label className={formStyles.label}>Start Chainage</label><input type="number" name="startChainage" value={run.startChainage} onChange={e => handleRunChange(index, e)} className={formStyles.input} /></div>
                 <div><label className={formStyles.label}>End Chainage</label><input type="number" name="endChainage" value={run.endChainage} onChange={e => handleRunChange(index, e)} className={formStyles.input} /></div>
                 <div><label className={formStyles.label}>Length (m)</label><input name="length" value={run.length} className={formStyles.readOnlyInput} readOnly /></div>
                 <div><label className={formStyles.label}>Width (m)</label><input type="number" name="width" value={run.width} onChange={e => handleRunChange(index, e)} className={formStyles.input} /></div>
                 <div><label className={formStyles.label}>Area (m²)</label><input name="area" value={run.area} className={formStyles.readOnlyInput} readOnly /></div>
                 <div><label className={formStyles.label}>Volume Sprayed (L)</label><input type="number" name="volumeSprayedLitres" value={run.volumeSprayedLitres} onChange={e => handleRunChange(index, e)} className={formStyles.input} /></div>
                 <div className="col-span-2"><label className={formStyles.label}>Comments</label><input name="comments" value={run.comments} onChange={e => handleRunChange(index, e)} className={formStyles.input} /></div>
            </div>
          </div>
        ))}
        <button onClick={addRun} className={formStyles.button}>+ Add Run</button>
      </div>
    </div>
  );
};

export default SprayReportForm;