import React, { useState, useEffect } from 'react';
import { AsphaltPlacementData, AsphaltPlacementRow, AsphaltWeatherCondition, Job } from '../../types';
import VoiceInput from '../common/VoiceInput';

interface AsphaltPlacementFormProps {
  initialData: AsphaltPlacementData;
  onUpdate: (data: AsphaltPlacementData) => void;
  job: Job;
}

const formStyles = {
  input:
    'w-full px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sga-500 focus:border-sga-500',
  readOnlyInput: 'w-full px-2 py-1 text-sm text-gray-700 bg-gray-200 border border-gray-300 rounded-md focus:outline-none',
  label: 'block text-sm font-medium text-gray-700 mb-1',
  button: 'px-3 py-1 text-sm font-semibold text-white bg-sga-700 rounded-md hover:bg-sga-800',
  removeButton: 'px-2 py-1 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700',
};

const recalculateProgressiveTonnes = (placements: AsphaltPlacementRow[]): AsphaltPlacementRow[] => {
  let cumulativeTonnes = 0;
  return placements.map((p) => {
    const currentTonnes = parseFloat(p.tonnes) || 0;
    cumulativeTonnes += currentTonnes;
    return { ...p, progressiveTonnes: String(cumulativeTonnes.toFixed(2)) };
  });
};

export const AsphaltPlacementForm: React.FC<AsphaltPlacementFormProps> = ({ initialData, onUpdate, job }) => {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    onUpdate(data);
  }, [data, onUpdate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVoiceInput = (fieldName: keyof AsphaltPlacementData, text: string) => {
    setData((prev) => ({ ...prev, [fieldName]: text }));
  };

  const handlePlacementVoiceInput = (index: number, fieldName: keyof AsphaltPlacementRow, text: string) => {
    const updatedPlacements = [...data.placements];
    (updatedPlacements[index] as any)[fieldName] = text;
    setData((prev) => ({ ...prev, placements: updatedPlacements }));
  };

  const handlePlacementChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const updatedPlacements = [...data.placements];
    let updatedRow = { ...updatedPlacements[index], [name]: value };

    // Automatic calculations
    if (name === 'startChainage' || name === 'endChainage') {
      const start = parseFloat(updatedRow.startChainage);
      const end = parseFloat(updatedRow.endChainage);
      if (!isNaN(start) && !isNaN(end) && end >= start) {
        updatedRow.length = (end - start).toFixed(2);
      } else {
        updatedRow.length = '';
      }
    }

    // Recalculate area if length or width changes
    const length = parseFloat(updatedRow.length);
    const width = parseFloat(updatedRow.runWidth);
    if (!isNaN(length) && !isNaN(width)) {
      updatedRow.area = (length * width).toFixed(2);
    } else {
      updatedRow.area = '';
    }

    updatedPlacements[index] = updatedRow;

    // Always recalculate progressive tonnes to ensure consistency
    const recalculatedPlacements = recalculateProgressiveTonnes(updatedPlacements);
    setData((prev) => ({ ...prev, placements: recalculatedPlacements }));
  };

  const handleTableRowChange = (
    section: 'weatherConditions' | 'placements',
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    if (section === 'placements') {
      handlePlacementChange(index, e);
      return;
    }
    const { name, value } = e.target;
    const list = [...(data as any)[section]];
    (list[index] as any)[name] = value;
    setData((prev) => ({ ...prev, [section]: list }));
  };

  const addRow = (section: 'weatherConditions' | 'placements') => {
    if (section === 'weatherConditions') {
      const newRow: AsphaltWeatherCondition = {
        time: '',
        airTemp: '',
        roadTemp: '',
        windSpeed: '',
        chillFactor: '',
        dayNight: 'Day',
      };
      setData((prev) => ({ ...prev, weatherConditions: [...prev.weatherConditions, newRow] }));
    } else {
      const newRow: AsphaltPlacementRow = {
        docketNumber: '',
        tonnes: '',
        progressiveTonnes: '',
        time: '',
        incomingTemp: '',
        placementTemp: '',
        tempsCompliant: '',
        startChainage: '',
        endChainage: '',
        length: '',
        runWidth: '',
        area: '',
        depth: '',
        laneRun: '',
        comments: '',
        docketTemp: '',
        dispatchTime: '',
        detailsMatchSpec: '',
        nonConformanceReason: '',
        breakdownPasses: '',
      };
      setData((prev) => ({ ...prev, placements: recalculateProgressiveTonnes([...prev.placements, newRow]) }));
    }
  };

  const removeRow = (section: 'weatherConditions' | 'placements', index: number) => {
    if (section === 'placements') {
      const updatedPlacements = data.placements.filter((_, i) => i !== index);
      setData((prev) => ({ ...prev, placements: recalculateProgressiveTonnes(updatedPlacements) }));
    } else {
      const list = (data as any)[section].filter((_: any, i: number) => i !== index);
      setData((prev) => ({ ...prev, [section]: list }));
    }
  };

  return (
    <div className="p-6 space-y-6 bg-white border border-gray-200 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-sga-700">Asphalt Placement Record</h3>

      <div className="p-4 space-y-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className={formStyles.label} htmlFor="job-client">
              Client
            </label>
            <input id="job-client" type="text" value={job.client} className={formStyles.readOnlyInput} readOnly />
          </div>
          <div>
            <label className={formStyles.label} htmlFor="job-no">
              Job No
            </label>
            <input id="job-no" type="text" value={job.jobNo} className={formStyles.readOnlyInput} readOnly />
          </div>
          <div className="md:col-span-2">
            <label className={formStyles.label} htmlFor="job-location">
              Location
            </label>
            <input id="job-location" type="text" value={job.location} className={formStyles.readOnlyInput} readOnly />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="lotNo" className={formStyles.label}>
            Lot No
          </label>
          <input id="lotNo" type="text" name="lotNo" value={data.lotNo} onChange={handleChange} className={formStyles.input} />
        </div>
        <div>
          <label htmlFor="sheetNo" className={formStyles.label}>
            Sheet No
          </label>
          <input
            id="sheetNo"
            type="text"
            name="sheetNo"
            value={data.sheetNo}
            onChange={handleChange}
            className={formStyles.input}
          />
        </div>
      </div>

      <div className="p-4 space-y-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-semibold">Environmental & Compaction</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="pavementSurfaceCondition" className={formStyles.label}>
              Pavement Surface Condition
            </label>
            <select
              id="pavementSurfaceCondition"
              name="pavementSurfaceCondition"
              value={data.pavementSurfaceCondition}
              onChange={handleChange}
              className={formStyles.input}
            >
              <option value="">Select...</option>
              <option>Dry</option>
              <option>Damp</option>
              <option>Wet</option>
            </select>
          </div>
          <div>
            <label htmlFor="rainfallDuringShift" className={formStyles.label}>
              Rainfall During Shift?
            </label>
            <select
              id="rainfallDuringShift"
              name="rainfallDuringShift"
              value={data.rainfallDuringShift}
              onChange={handleChange}
              className={formStyles.input}
            >
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          {data.rainfallDuringShift === 'Yes' && (
            <div className="md:col-span-2">
              <label htmlFor="rainfallActions" className={formStyles.label}>
                Actions Taken for Rainfall
              </label>
              <VoiceInput onTextChange={(text) => handleVoiceInput('rainfallActions', text)} currentValue={data.rainfallActions}>
                <textarea
                  id="rainfallActions"
                  name="rainfallActions"
                  value={data.rainfallActions}
                  onChange={handleChange}
                  className={formStyles.input}
                  rows={1}
                ></textarea>
              </VoiceInput>
            </div>
          )}
          <div>
            <label htmlFor="rollingPatternId" className={formStyles.label}>
              Rolling Pattern ID
            </label>
            <input
              id="rollingPatternId"
              type="text"
              name="rollingPatternId"
              value={data.rollingPatternId}
              onChange={handleChange}
              className={formStyles.input}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold">Weather Conditions</h4>
        {data.weatherConditions.map((row, index) => (
          <div key={index} className="grid items-end grid-cols-7 gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
            <div className="col-span-6 grid grid-cols-6 gap-2">
              <div>
                <label htmlFor={`weatherTime-${index}`} className={formStyles.label}>
                  Time
                </label>
                <input
                  id={`weatherTime-${index}`}
                  type="time"
                  name="time"
                  value={row.time}
                  onChange={(e) => handleTableRowChange('weatherConditions', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label htmlFor={`airTemp-${index}`} className={formStyles.label}>
                  Air Temp (°C)
                </label>
                <input
                  id={`airTemp-${index}`}
                  type="number"
                  name="airTemp"
                  value={row.airTemp}
                  onChange={(e) => handleTableRowChange('weatherConditions', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label htmlFor={`roadTemp-${index}`} className={formStyles.label}>
                  Road Temp (°C)
                </label>
                <input
                  id={`roadTemp-${index}`}
                  type="number"
                  name="roadTemp"
                  value={row.roadTemp}
                  onChange={(e) => handleTableRowChange('weatherConditions', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label htmlFor={`windSpeed-${index}`} className={formStyles.label}>
                  Wind Speed
                </label>
                <input
                  id={`windSpeed-${index}`}
                  type="text"
                  name="windSpeed"
                  value={row.windSpeed}
                  onChange={(e) => handleTableRowChange('weatherConditions', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label htmlFor={`chillFactor-${index}`} className={formStyles.label}>
                  Chill Factor
                </label>
                <input
                  id={`chillFactor-${index}`}
                  type="text"
                  name="chillFactor"
                  value={row.chillFactor}
                  onChange={(e) => handleTableRowChange('weatherConditions', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label htmlFor={`dayNight-${index}`} className={formStyles.label}>
                  Day/Night
                </label>
                <select
                  id={`dayNight-${index}`}
                  name="dayNight"
                  value={row.dayNight}
                  onChange={(e) => handleTableRowChange('weatherConditions', index, e)}
                  className={formStyles.input}
                >
                  <option value="Day">Day</option>
                  <option value="Night">Night</option>
                </select>
              </div>
            </div>
            <div className="text-right">
              {data.weatherConditions.length > 1 && (
                <button onClick={() => removeRow('weatherConditions', index)} className={formStyles.removeButton}>
                  X
                </button>
              )}
            </div>
          </div>
        ))}
        <button onClick={() => addRow('weatherConditions')} className={formStyles.button}>
          + Add Weather Reading
        </button>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold">Placement & Conformance Data</h4>
        {data.placements.map((row, index) => (
          <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start">
              <span className="font-bold text-gray-700">Placement Record #{index + 1}</span>
              <button onClick={() => removeRow('placements', index)} className={formStyles.removeButton}>
                X
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-3 mt-2">
              {/* Row 1: Core Details */}
              <div>
                <label htmlFor={`docketNumber-${index}`} className={formStyles.label}>
                  Docket #
                </label>
                <input
                  id={`docketNumber-${index}`}
                  name="docketNumber"
                  value={row.docketNumber}
                  onChange={(e) => handleTableRowChange('placements', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label htmlFor={`time-${index}`} className={formStyles.label}>
                  Time
                </label>
                <input
                  id={`time-${index}`}
                  type="time"
                  name="time"
                  value={row.time}
                  onChange={(e) => handleTableRowChange('placements', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label htmlFor={`tonnes-${index}`} className={formStyles.label}>
                  Tonnes
                </label>
                <input
                  id={`tonnes-${index}`}
                  type="number"
                  name="tonnes"
                  value={row.tonnes}
                  onChange={(e) => handleTableRowChange('placements', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label htmlFor={`progressiveTonnes-${index}`} className={formStyles.label}>
                  Prog. Tonnes
                </label>
                <input
                  id={`progressiveTonnes-${index}`}
                  type="number"
                  name="progressiveTonnes"
                  value={row.progressiveTonnes}
                  className={formStyles.readOnlyInput}
                  readOnly
                />
              </div>
              <div>
                <label htmlFor={`breakdownPasses-${index}`} className={formStyles.label}>
                  Breakdown Passes
                </label>
                <input
                  id={`breakdownPasses-${index}`}
                  type="number"
                  name="breakdownPasses"
                  value={row.breakdownPasses}
                  onChange={(e) => handleTableRowChange('placements', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label htmlFor={`laneRun-${index}`} className={formStyles.label}>
                  Lane/Run
                </label>
                <input
                  id={`laneRun-${index}`}
                  name="laneRun"
                  value={row.laneRun}
                  onChange={(e) => handleTableRowChange('placements', index, e)}
                  className={formStyles.input}
                />
              </div>

              <hr className="col-span-2 md:col-span-4 lg:col-span-6 my-1 border-t border-gray-300" />

              {/* Row 2: Dimensions & Calculations */}
              <div>
                <label htmlFor={`startChainage-${index}`} className={formStyles.label}>
                  Start Chainage
                </label>
                <input
                  id={`startChainage-${index}`}
                  type="number"
                  name="startChainage"
                  value={row.startChainage}
                  onChange={(e) => handleTableRowChange('placements', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label htmlFor={`endChainage-${index}`} className={formStyles.label}>
                  End Chainage
                </label>
                <input
                  id={`endChainage-${index}`}
                  type="number"
                  name="endChainage"
                  value={row.endChainage}
                  onChange={(e) => handleTableRowChange('placements', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label htmlFor={`length-${index}`} className={formStyles.label}>
                  Length (m)
                </label>
                <input id={`length-${index}`} name="length" value={row.length} className={formStyles.readOnlyInput} readOnly />
              </div>
              <div>
                <label htmlFor={`runWidth-${index}`} className={formStyles.label}>
                  Run Width (m)
                </label>
                <input
                  id={`runWidth-${index}`}
                  type="number"
                  name="runWidth"
                  value={row.runWidth}
                  onChange={(e) => handleTableRowChange('placements', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label htmlFor={`depth-${index}`} className={formStyles.label}>
                  Depth (mm)
                </label>
                <input
                  id={`depth-${index}`}
                  type="number"
                  name="depth"
                  value={row.depth}
                  onChange={(e) => handleTableRowChange('placements', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label htmlFor={`area-${index}`} className={formStyles.label}>
                  Area (m²)
                </label>
                <input id={`area-${index}`} name="area" value={row.area} className={formStyles.readOnlyInput} readOnly />
              </div>

              <hr className="col-span-2 md:col-span-4 lg:col-span-6 my-1 border-t border-gray-300" />

              {/* Row 3: Conformance */}
              <div>
                <label htmlFor={`docketTemp-${index}`} className={formStyles.label}>
                  Docket Temp
                </label>
                <input
                  id={`docketTemp-${index}`}
                  type="number"
                  name="docketTemp"
                  value={row.docketTemp}
                  onChange={(e) => handleTableRowChange('placements', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label htmlFor={`dispatchTime-${index}`} className={formStyles.label}>
                  Dispatch Time
                </label>
                <input
                  id={`dispatchTime-${index}`}
                  type="time"
                  name="dispatchTime"
                  value={row.dispatchTime}
                  onChange={(e) => handleTableRowChange('placements', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label htmlFor={`incomingTemp-${index}`} className={formStyles.label}>
                  Incoming Temp
                </label>
                <input
                  id={`incomingTemp-${index}`}
                  type="number"
                  name="incomingTemp"
                  value={row.incomingTemp}
                  onChange={(e) => handleTableRowChange('placements', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label htmlFor={`placementTemp-${index}`} className={formStyles.label}>
                  Placement Temp
                </label>
                <input
                  id={`placementTemp-${index}`}
                  type="number"
                  name="placementTemp"
                  value={row.placementTemp}
                  onChange={(e) => handleTableRowChange('placements', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label htmlFor={`tempsCompliant-${index}`} className={formStyles.label}>
                  Temps OK?
                </label>
                <select
                  id={`tempsCompliant-${index}`}
                  name="tempsCompliant"
                  value={row.tempsCompliant}
                  onChange={(e) => handleTableRowChange('placements', index, e)}
                  className={formStyles.input}
                >
                  <option value="">?</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label htmlFor={`detailsMatchSpec-${index}`} className={formStyles.label}>
                  Details Match Spec?
                </label>
                <select
                  id={`detailsMatchSpec-${index}`}
                  name="detailsMatchSpec"
                  value={row.detailsMatchSpec}
                  onChange={(e) => handleTableRowChange('placements', index, e)}
                  className={formStyles.input}
                >
                  <option value="">?</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="col-span-2 md:col-span-4 lg:col-span-6">
                <label htmlFor={`comments-${index}`} className={formStyles.label}>
                  Comments
                </label>
                <input
                  id={`comments-${index}`}
                  name="comments"
                  value={row.comments}
                  onChange={(e) => handleTableRowChange('placements', index, e)}
                  className={formStyles.input}
                />
              </div>

              {row.detailsMatchSpec === 'No' && (
                <div className="col-span-2 md:col-span-4 lg:col-span-6">
                  <label htmlFor={`nonConformanceReason-${index}`} className={formStyles.label}>
                    Reason for Non-Conformance
                  </label>
                  <VoiceInput
                    onTextChange={(text) => handlePlacementVoiceInput(index, 'nonConformanceReason', text)}
                    currentValue={row.nonConformanceReason}
                  >
                    <textarea
                      id={`nonConformanceReason-${index}`}
                      name="nonConformanceReason"
                      value={row.nonConformanceReason}
                      onChange={(e) => handleTableRowChange('placements', index, e)}
                      className={formStyles.input}
                      rows={2}
                    ></textarea>
                  </VoiceInput>
                </div>
              )}
            </div>
          </div>
        ))}
        <button onClick={() => addRow('placements')} className={formStyles.button}>
          + Add Placement Row
        </button>
      </div>
    </div>
  );
};

export default AsphaltPlacementForm;
