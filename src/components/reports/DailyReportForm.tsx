import React, { useState, useEffect, useRef } from 'react';
import { SgaDailyReportData, Job, CrewResource, EquipmentResource } from '../../types';
import SignaturePad from '../common/SignaturePad';
import SgaLogo from '../common/SgaLogo';
import VoiceInput from '../common/VoiceInput';

interface DailyReportFormProps {
  initialData: SgaDailyReportData;
  onUpdate: (data: SgaDailyReportData) => void;
  isJobSheetAvailable?: boolean;
  job: Job;
  qaSpec?: string;
  totalArea?: string;
  totalTonnesDelivered?: string;
  totalTonnesLaid?: string;
  crewResources: CrewResource[];
  equipmentResources: EquipmentResource[];
}

const formStyles = {
  input:
    'w-full px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sga-500 focus:border-sga-500',
  readOnlyInput: 'w-full px-2 py-1 text-sm text-gray-700 bg-gray-200 border border-gray-300 rounded-md focus:outline-none',
  textarea:
    'w-full px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sga-500 focus:border-sga-500',
  label: 'block text-sm font-medium text-gray-700 mb-1',
  button: 'px-3 py-1 text-sm font-semibold text-white bg-sga-700 rounded-md hover:bg-sga-800',
  removeButton: 'px-2 py-1 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700',
};

const calculateHours = (start: string, end: string): string => {
  if (!start || !end) return '';
  try {
    const startDate = new Date(`1970-01-01T${start}:00`);
    const endDate = new Date(`1970-01-01T${end}:00`);
    let diff = endDate.getTime() - startDate.getTime();
    if (diff < 0) {
      diff += 24 * 60 * 60 * 1000; // Handle overnight shifts
    }
    const hours = diff / (1000 * 60 * 60);
    return hours.toFixed(2);
  } catch (e) {
    console.error('Invalid time format for hour calculation');
    return '';
  }
};

type SgaDailyReportArrayKeys =
  | 'works'
  | 'actualWorks'
  | 'plantEquipment'
  | 'onSiteTests'
  | 'trucks'
  | 'correctorDetails'
  | 'labour'
  | 'weatherConditions';

export const DailyReportForm: React.FC<DailyReportFormProps> = ({
  initialData,
  onUpdate,
  isJobSheetAvailable,
  job,
  qaSpec,
  totalArea,
  totalTonnesDelivered,
  totalTonnesLaid,
  crewResources,
  equipmentResources,
}) => {
  const [data, setData] = useState(initialData);
  const clientSignaturePadRef = useRef<{ toDataURL: () => string; clear: () => void }>(null);
  const isProfiling = job.division === 'Profiling';

  // Filter resources based on the job's division
  const crewList = crewResources.filter((c) => c.division === job.division || c.division === 'Common');
  const equipmentList = equipmentResources.filter((e) => e.division === job.division || e.division === 'Common');

  useEffect(() => {
    onUpdate(data);
  }, [data, onUpdate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTableRowChange = (
    section: SgaDailyReportArrayKeys,
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const list = [...((data[section] as any[]) || [])];
    const currentRow = { ...list[index] };

    if (type === 'checkbox') {
      currentRow[name] = (e.target as HTMLInputElement).checked;
    } else {
      currentRow[name] = value;
    }

    // Check if we need to calculate hours
    if (['plantEquipment', 'trucks', 'labour'].includes(section) && (name === 'startTime' || name === 'endTime')) {
      const { startTime, endTime } = currentRow;
      currentRow.hours = calculateHours(startTime, endTime);
    }

    list[index] = currentRow;
    setData((prev) => ({ ...prev, [section]: list }));
  };

  const handleWeatherChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const list = [...(data.weatherConditions || [])];
    (list[index] as any)[name] = value;
    setData((prev) => ({ ...prev, weatherConditions: list }));
  };

  const addWeatherRow = () => {
    const newRow = { time: '', airTemp: '', roadTemp: '', windSpeed: '', chillFactor: '', dayNight: 'Day' as const };
    setData((prev) => ({ ...prev, weatherConditions: [...(prev.weatherConditions || []), newRow] }));
  };

  const removeWeatherRow = (index: number) => {
    const list = (data.weatherConditions || []).filter((_, i) => i !== index);
    setData((prev) => ({ ...prev, weatherConditions: list }));
  };

  const addRow = (section: SgaDailyReportArrayKeys) => {
    let newRow: any;
    if (section === 'works')
      newRow = { mixType: '', spec: '', area: '', depth: '', tonnes: '', comments: '' };
    else if (section === 'actualWorks')
      newRow = { description: '', area: '', depth: '', tonnes: '', comments: '' };
    else if (section === 'plantEquipment')
      newRow = { type: '', supplier: '', plantId: '', prestart: '', startTime: '', endTime: '', hours: '', comments: '' };
    else if (section === 'onSiteTests')
      newRow = { testType: '', location: '', result: '', passFail: '', comments: '' };
    else if (section === 'trucks')
      newRow = { truckId: '', contractor: '', startTime: '', endTime: '', hours: '', isSixWheeler: false };
    else if (section === 'correctorDetails') newRow = { quantity: '', location: '', mixType: '' };
    else if (section === 'labour')
      newRow = { fullName: '', startTime: '', endTime: '', hours: '', comments: '' };
    else return;
    setData((prev) => ({ ...prev, [section]: [...((prev[section] as any[]) || []), newRow] }));
  };

  const removeRow = (section: SgaDailyReportArrayKeys, index: number) => {
    const list = ((data[section] as any[]) || []).filter((_, i) => i !== index);
    setData((prev) => ({ ...prev, [section]: list }));
  };

  const handleSignatureChange = () => {
    const signatureData = clientSignaturePadRef.current?.toDataURL() || '';
    setData((prev) => ({ ...prev, clientSignature: signatureData }));
  };

  const handleClearSignature = () => {
    if (window.confirm("Are you sure you want to clear the client's signature?")) {
      clientSignaturePadRef.current?.clear();
      handleSignatureChange();
    }
  };

  const handleVoiceInput = (fieldName: keyof SgaDailyReportData, text: string) => {
    setData((prev) => ({ ...prev, [fieldName]: text }));
  };

  return (
    <div className="p-6 space-y-6 bg-white border border-gray-200 rounded-lg shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-sga-700">SGA Daily Report</h3>
          <p className="text-sm text-gray-500">All data entered here will be formatted into the final report document.</p>
        </div>
        <SgaLogo className="h-10" />
      </div>

      <div className="p-4 space-y-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="daily-report-client" className={formStyles.label}>
              Client
            </label>
            <input
              id="daily-report-client"
              type="text"
              value={job.client}
              className={formStyles.readOnlyInput}
              readOnly
            />
          </div>
          <div>
            <label htmlFor="daily-report-project" className={formStyles.label}>
              Project
            </label>
            <input
              id="daily-report-project"
              type="text"
              value={job.jobSheetData?.projectName || job.projectName || data.project}
              className={formStyles.readOnlyInput}
              readOnly
            />
          </div>
          <div>
            <label htmlFor="daily-report-jobno" className={formStyles.label}>
              Job No.
            </label>
            <input id="daily-report-jobno" type="text" value={job.jobNo} className={formStyles.readOnlyInput} readOnly />
          </div>
          <div>
            <label htmlFor="daily-report-address" className={formStyles.label}>
              Address
            </label>
            <input
              id="daily-report-address"
              type="text"
              value={job.location}
              className={formStyles.readOnlyInput}
              readOnly
            />
          </div>
          <div>
            <label htmlFor="daily-report-date" className={formStyles.label}>
              Date
            </label>
            <input
              id="daily-report-date"
              type="text"
              value={job.jobSheetData?.date || data.date}
              className={formStyles.readOnlyInput}
              readOnly
            />
          </div>
          <div>
            <label htmlFor="daily-report-completedBy" className={formStyles.label}>
              Completed By
            </label>
            <input
              id="daily-report-completedBy"
              type="text"
              name="completedBy"
              value={data.completedBy}
              className={formStyles.readOnlyInput}
              readOnly
            />
          </div>
          <div>
            <label htmlFor="daily-report-startTime" className={formStyles.label}>
              Start Time
            </label>
            <input
              id="daily-report-startTime"
              type="time"
              name="startTime"
              value={data.startTime}
              onChange={handleChange}
              className={formStyles.input}
            />
          </div>
          <div>
            <label htmlFor="daily-report-finishTime" className={formStyles.label}>
              Finish Time
            </label>
            <input
              id="daily-report-finishTime"
              type="time"
              name="finishTime"
              value={data.finishTime}
              onChange={handleChange}
              className={formStyles.input}
            />
          </div>
          {qaSpec && (
            <div className="lg:col-span-2">
              <label htmlFor="daily-report-qaspec" className={formStyles.label}>
                QA Specification
              </label>
              <input id="daily-report-qaspec" type="text" value={qaSpec} className={formStyles.readOnlyInput} readOnly />
            </div>
          )}
        </div>
      </div>

      {/* Weather Conditions */}
      <div className="space-y-2">
        <h4 className="font-semibold">Weather Conditions</h4>
        {(data.weatherConditions || []).map((row, index) => (
          <div
            key={index}
            className="grid items-end grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md"
          >
            <div>
              <label htmlFor={`dr-weather-time-${index}`} className={formStyles.label}>
                Time
              </label>
              <input
                id={`dr-weather-time-${index}`}
                type="time"
                name="time"
                value={row.time}
                onChange={(e) => handleWeatherChange(index, e)}
                className={formStyles.input}
              />
            </div>
            <div>
              <label htmlFor={`dr-weather-airtemp-${index}`} className={formStyles.label}>
                Air Temp (°C)
              </label>
              <input
                id={`dr-weather-airtemp-${index}`}
                type="number"
                name="airTemp"
                value={row.airTemp}
                onChange={(e) => handleWeatherChange(index, e)}
                className={formStyles.input}
              />
            </div>
            <div>
              <label htmlFor={`dr-weather-roadtemp-${index}`} className={formStyles.label}>
                Road Temp (°C)
              </label>
              <input
                id={`dr-weather-roadtemp-${index}`}
                type="number"
                name="roadTemp"
                value={row.roadTemp}
                onChange={(e) => handleWeatherChange(index, e)}
                className={formStyles.input}
              />
            </div>
            <div>
              <label htmlFor={`dr-weather-wind-${index}`} className={formStyles.label}>
                Wind Speed
              </label>
              <input
                id={`dr-weather-wind-${index}`}
                type="text"
                name="windSpeed"
                value={row.windSpeed}
                onChange={(e) => handleWeatherChange(index, e)}
                className={formStyles.input}
              />
            </div>
            <div>
              <label htmlFor={`dr-weather-comments-${index}`} className={formStyles.label}>
                Comments
              </label>
              <input
                id={`dr-weather-comments-${index}`}
                type="text"
                name="chillFactor"
                value={row.chillFactor}
                onChange={(e) => handleWeatherChange(index, e)}
                placeholder="e.g. Sunny, Overcast"
                className={formStyles.input}
              />
            </div>
            <div>
              <label htmlFor={`dr-weather-daynight-${index}`} className={formStyles.label}>
                Day/Night
              </label>
              <select
                id={`dr-weather-daynight-${index}`}
                name="dayNight"
                value={row.dayNight}
                onChange={(e) => handleWeatherChange(index, e)}
                className={formStyles.input}
              >
                <option value="Day">Day</option>
                <option value="Night">Night</option>
              </select>
            </div>
            <div className="text-right">
              <button onClick={() => removeWeatherRow(index)} className={formStyles.removeButton}>
                X
              </button>
            </div>
          </div>
        ))}
        <button onClick={addWeatherRow} className={formStyles.button}>
          + Add Weather Reading
        </button>
      </div>

      {/* Assigned Works */}
      <div className="space-y-2">
        <h4 className="font-semibold">Assigned Works</h4>
        {data.works.map((row, index) => (
          <div
            key={index}
            className={`grid items-end ${isProfiling ? 'grid-cols-5' : 'grid-cols-6'} gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md`}
          >
            {!isProfiling && (
              <>
                <div>
                  <label htmlFor={`dr-work-mix-${index}`} className={formStyles.label}>
                    Mix Type
                  </label>
                  <input id={`dr-work-mix-${index}`} value={row.mixType} className={formStyles.readOnlyInput} readOnly />
                </div>
                <div>
                  <label htmlFor={`dr-work-spec-${index}`} className={formStyles.label}>
                    Spec
                  </label>
                  <input id={`dr-work-spec-${index}`} value={row.spec} className={formStyles.readOnlyInput} readOnly />
                </div>
              </>
            )}
            <div>
              <label htmlFor={`dr-work-area-${index}`} className={formStyles.label}>
                Area (m2)
              </label>
              <input id={`dr-work-area-${index}`} value={row.area} className={formStyles.readOnlyInput} readOnly />
            </div>
            <div>
              <label htmlFor={`dr-work-depth-${index}`} className={formStyles.label}>
                Depth (mm)
              </label>
              <input id={`dr-work-depth-${index}`} value={row.depth} className={formStyles.readOnlyInput} readOnly />
            </div>
            <div>
              <label htmlFor={`dr-work-tonnes-${index}`} className={formStyles.label}>
                Tonnes
              </label>
              <input id={`dr-work-tonnes-${index}`} value={row.tonnes} className={formStyles.readOnlyInput} readOnly />
            </div>
            <div>
              <label htmlFor={`dr-work-comments-${index}`} className={formStyles.label}>
                Comments
              </label>
              <input
                id={`dr-work-comments-${index}`}
                name="comments"
                value={row.comments}
                onChange={(e) => handleTableRowChange('works', index, e)}
                className={formStyles.input}
              />
            </div>
          </div>
        ))}
        {isJobSheetAvailable ? (
          <p className="text-xs italic text-gray-500">
            Assigned work items are pre-filled from the Job Sheet and cannot be edited (except for comments).
          </p>
        ) : (
          <p className="text-xs italic text-gray-500">No works assigned via Job Sheet.</p>
        )}
      </div>

      {/* Calculated Placement Totals for Asphalt */}
      {job.division === 'Asphalt' && (
        <div className="p-4 space-y-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-semibold">Calculated Placement Totals</h4>
          <p className="text-xs italic text-gray-500">
            These values are automatically calculated from the Asphalt Placement tab.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="total-area" className={formStyles.label}>
                Total Area (m²)
              </label>
              <input id="total-area" type="text" value={totalArea} className={formStyles.readOnlyInput} readOnly />
            </div>
            <div>
              <label htmlFor="total-tonnes-delivered" className={formStyles.label}>
                Total Tonnes Delivered
              </label>
              <input
                id="total-tonnes-delivered"
                type="text"
                value={totalTonnesDelivered}
                className={formStyles.readOnlyInput}
                readOnly
              />
            </div>
            <div>
              <label htmlFor="total-tonnes-laid" className={formStyles.label}>
                Est. Tonnes Laid (from Area)
              </label>
              <input id="total-tonnes-laid" type="text" value={totalTonnesLaid} className={formStyles.readOnlyInput} readOnly />
            </div>
          </div>
        </div>
      )}

      {/* Actual Work Performed */}
      <div className="space-y-2">
        <h4 className="font-semibold">Actual Work Performed (Variations or Multiple Stages)</h4>
        {(data.actualWorks || []).map((row, index) => (
          <div
            key={index}
            className="grid items-end grid-cols-6 gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md"
          >
            <div className="col-span-2">
              <label htmlFor={`dr-actual-desc-${index}`} className={formStyles.label}>
                Work Description
              </label>
              <input
                id={`dr-actual-desc-${index}`}
                name="description"
                value={row.description}
                onChange={(e) => handleTableRowChange('actualWorks', index, e)}
                className={formStyles.input}
              />
            </div>
            <div>
              <label htmlFor={`dr-actual-area-${index}`} className={formStyles.label}>
                Area (m2)
              </label>
              <input
                id={`dr-actual-area-${index}`}
                type="number"
                name="area"
                value={row.area}
                onChange={(e) => handleTableRowChange('actualWorks', index, e)}
                className={formStyles.input}
              />
            </div>
            <div>
              <label htmlFor={`dr-actual-depth-${index}`} className={formStyles.label}>
                Depth (mm)
              </label>
              <input
                id={`dr-actual-depth-${index}`}
                type="number"
                name="depth"
                value={row.depth}
                onChange={(e) => handleTableRowChange('actualWorks', index, e)}
                className={formStyles.input}
              />
            </div>
            <div>
              <label htmlFor={`dr-actual-tonnes-${index}`} className={formStyles.label}>
                Tonnes
              </label>
              <input
                id={`dr-actual-tonnes-${index}`}
                type="number"
                name="tonnes"
                value={row.tonnes}
                onChange={(e) => handleTableRowChange('actualWorks', index, e)}
                className={formStyles.input}
              />
            </div>
            <div className="text-right">
              <button onClick={() => removeRow('actualWorks', index)} className={formStyles.removeButton}>
                X
              </button>
            </div>
          </div>
        ))}
        <button onClick={() => addRow('actualWorks')} className={formStyles.button}>
          + Add Work Performed
        </button>
      </div>

      {/* Corrector Usage (not for Profiling) */}
      {!isProfiling && (
        <div className="p-4 space-y-3 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-semibold">Corrector Usage</h4>
          <div>
            <p className={formStyles.label}>Was corrector used on this job?</p>
            <div className="flex items-center space-x-6 mt-2">
              <label htmlFor="corrector-yes" className="flex items-center text-sm text-gray-900 cursor-pointer">
                <input
                  id="corrector-yes"
                  type="radio"
                  name="correctorUsed"
                  value="Yes"
                  checked={data.correctorUsed === 'Yes'}
                  onChange={handleChange}
                  className="w-4 h-4 text-sga-600 border-gray-300 focus:ring-sga-500"
                />
                <span className="ml-2">Yes</span>
              </label>
              <label htmlFor="corrector-no" className="flex items-center text-sm text-gray-900 cursor-pointer">
                <input
                  id="corrector-no"
                  type="radio"
                  name="correctorUsed"
                  value="No"
                  checked={data.correctorUsed === 'No'}
                  onChange={handleChange}
                  className="w-4 h-4 text-sga-600 border-gray-300 focus:ring-sga-500"
                />
                <span className="ml-2">No</span>
              </label>
            </div>
          </div>
          {data.correctorUsed === 'Yes' && (
            <div className="pt-4 mt-4 space-y-2 border-t border-gray-300">
              <h5 className="font-semibold">Corrector Details</h5>
              {data.correctorDetails.map((row, index) => (
                <div
                  key={index}
                  className="grid items-end grid-cols-4 gap-2 p-2 bg-white border border-gray-200 rounded-md"
                >
                  <div className="col-span-3 grid grid-cols-3 gap-2">
                    <div>
                      <label htmlFor={`dr-corrector-qty-${index}`} className={formStyles.label}>
                        Quantity
                      </label>
                      <input
                        id={`dr-corrector-qty-${index}`}
                        name="quantity"
                        value={row.quantity}
                        onChange={(e) => handleTableRowChange('correctorDetails', index, e)}
                        className={formStyles.input}
                        placeholder="e.g., 2 bags"
                      />
                    </div>
                    <div>
                      <label htmlFor={`dr-corrector-loc-${index}`} className={formStyles.label}>
                        Location
                      </label>
                      <input
                        id={`dr-corrector-loc-${index}`}
                        name="location"
                        value={row.location}
                        onChange={(e) => handleTableRowChange('correctorDetails', index, e)}
                        className={formStyles.input}
                        placeholder="e.g., CH 120-150"
                      />
                    </div>
                    <div>
                      <label htmlFor={`dr-corrector-mix-${index}`} className={formStyles.label}>
                        Mix Type
                      </label>
                      <input
                        id={`dr-corrector-mix-${index}`}
                        name="mixType"
                        value={row.mixType}
                        onChange={(e) => handleTableRowChange('correctorDetails', index, e)}
                        className={formStyles.input}
                        placeholder="e.g., AC14"
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <button onClick={() => removeRow('correctorDetails', index)} className={formStyles.removeButton}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={() => addRow('correctorDetails')} className={formStyles.button}>
                + Add Corrector Location
              </button>
            </div>
          )}
        </div>
      )}

      {/* Site Instructions & Comments */}
      <div>
        <label htmlFor="site-instructions" className={formStyles.label}>
          {isProfiling ? 'Site Instructions: Variations etc' : 'Site Instructions: Variations/ Corrector/ Handwork etc'}
        </label>
        <VoiceInput onTextChange={(text) => handleVoiceInput('siteInstructions', text)} currentValue={data.siteInstructions}>
          <textarea
            id="site-instructions"
            name="siteInstructions"
            value={data.siteInstructions}
            onChange={handleChange}
            rows={3}
            className={formStyles.textarea}
          ></textarea>
        </VoiceInput>
      </div>

      <div>
        <label htmlFor="additional-comments" className={formStyles.label}>
          Additional Comments
        </label>
        <VoiceInput
          onTextChange={(text) => handleVoiceInput('additionalComments', text)}
          currentValue={data.additionalComments}
        >
          <textarea
            id="additional-comments"
            name="additionalComments"
            value={data.additionalComments}
            onChange={handleChange}
            rows={3}
            className={formStyles.textarea}
          ></textarea>
        </VoiceInput>
      </div>

      {/* Client Approval */}
      <div className="p-4 space-y-3 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-semibold text-sga-700">Client Approval</h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="client-sign-name" className={formStyles.label}>
              Client Name
            </label>
            <input
              id="client-sign-name"
              type="text"
              name="clientSignName"
              value={data.clientSignName}
              onChange={handleChange}
              className={formStyles.input}
            />
          </div>
          <div>
            <label htmlFor="client-signature" className={formStyles.label}>
              Client Signature
              {data.correctorUsed === 'Yes' && (
                <span className="ml-2 text-xs font-bold text-red-500">(Mandatory for Corrector Use)</span>
              )}
            </label>
            <div id="client-signature" onMouseUp={handleSignatureChange} onTouchEnd={handleSignatureChange}>
              <SignaturePad ref={clientSignaturePadRef} initialSignature={data.clientSignature} />
            </div>
            <button onClick={handleClearSignature} className="w-full mt-2 px-4 py-1 text-sm text-white bg-gray-600 rounded-md hover:bg-gray-700">
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Plant/Equipment */}
      <div className="space-y-2">
        <h4 className="font-semibold">Plant / Equipment</h4>
        {data.plantEquipment.map((row, index) => (
          <div
            key={index}
            className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_3fr_auto] items-end gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md"
          >
            <div>
              <label className={formStyles.label}>Type</label>
              <select
                value={row.plantId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const equipment = equipmentList.find((eq) => eq.id === selectedId);
                  const list = [...data.plantEquipment];
                  if (equipment) {
                    list[index].type = equipment.name;
                    list[index].plantId = equipment.id;
                  } else {
                    list[index].type = '';
                    list[index].plantId = '';
                  }
                  setData((prev) => ({ ...prev, plantEquipment: list }));
                }}
                className={formStyles.input}
              >
                <option value="">Select...</option>
                {equipmentList.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name} ({eq.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={formStyles.label}>Plant ID</label>
              <input name="plantId" value={row.plantId} className={formStyles.readOnlyInput} readOnly />
            </div>
            <div>
              <label className={formStyles.label}>Prestart</label>
              <select
                name="prestart"
                value={row.prestart}
                onChange={(e) => handleTableRowChange('plantEquipment', index, e)}
                className={formStyles.input}
              >
                <option value="">?</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className={formStyles.label}>Start</label>
              <input
                type="time"
                name="startTime"
                value={row.startTime || ''}
                onChange={(e) => handleTableRowChange('plantEquipment', index, e)}
                className={formStyles.input}
              />
            </div>
            <div>
              <label className={formStyles.label}>End</label>
              <input
                type="time"
                name="endTime"
                value={row.endTime || ''}
                onChange={(e) => handleTableRowChange('plantEquipment', index, e)}
                className={formStyles.input}
              />
            </div>
            <div>
              <label className={formStyles.label}>Hours</label>
              <input type="number" name="hours" value={row.hours} className={formStyles.readOnlyInput} readOnly />
            </div>
            <div>
              <label className={formStyles.label}>Comments</label>
              <input
                name="comments"
                value={row.comments}
                onChange={(e) => handleTableRowChange('plantEquipment', index, e)}
                className={formStyles.input}
              />
            </div>
            <div className="text-right">
              <button onClick={() => removeRow('plantEquipment', index)} className={formStyles.removeButton}>
                X
              </button>
            </div>
          </div>
        ))}
        <button onClick={() => addRow('plantEquipment')} className={formStyles.button}>
          + Add Equipment
        </button>
      </div>

      {/* Trucks (Profiling only) */}
      {isProfiling && (
        <div className="space-y-2">
          <h4 className="font-semibold">Trucks</h4>
          {data.trucks && data.trucks.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_2fr_auto] items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md"
            >
              <div>
                <label className={formStyles.label}>Truck ID</label>
                <input
                  name="truckId"
                  value={row.truckId}
                  onChange={(e) => handleTableRowChange('trucks', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label className={formStyles.label}>Contractor</label>
                <input
                  name="contractor"
                  value={row.contractor}
                  onChange={(e) => handleTableRowChange('trucks', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label className={formStyles.label}>Start</label>
                <input
                  type="time"
                  name="startTime"
                  value={row.startTime || ''}
                  onChange={(e) => handleTableRowChange('trucks', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label className={formStyles.label}>End</label>
                <input
                  type="time"
                  name="endTime"
                  value={row.endTime || ''}
                  onChange={(e) => handleTableRowChange('trucks', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label className={formStyles.label}>Hours</label>
                <input type="number" name="hours" value={row.hours} className={formStyles.readOnlyInput} readOnly />
              </div>
              <div className="pt-5">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isSixWheeler"
                    checked={row.isSixWheeler}
                    onChange={(e) => handleTableRowChange('trucks', index, e)}
                    className="w-4 h-4 mr-2 text-sga-600 rounded focus:ring-sga-500"
                  />{' '}
                  6 Wheeler
                </label>
              </div>
              <div className="text-right">
                <button onClick={() => removeRow('trucks', index)} className={formStyles.removeButton}>
                  X
                </button>
              </div>
            </div>
          ))}
          <button onClick={() => addRow('trucks')} className={formStyles.button}>
            + Add Truck
          </button>
        </div>
      )}

      {/* Crew */}
      <div className="space-y-2">
        <h4 className="font-semibold">Crew</h4>
        {data.labour.map((row, index) => (
          <div
            key={index}
            className="grid grid-cols-[3fr_1fr_1fr_1fr_3fr_auto] items-end gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md"
          >
            <div>
              <label className={formStyles.label}>Full Name</label>
              <select
                name="fullName"
                value={row.fullName}
                onChange={(e) => handleTableRowChange('labour', index, e)}
                className={formStyles.input}
              >
                <option value="">Select...</option>
                {crewList.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={formStyles.label}>Start</label>
              <input
                type="time"
                name="startTime"
                value={row.startTime || ''}
                onChange={(e) => handleTableRowChange('labour', index, e)}
                className={formStyles.input}
              />
            </div>
            <div>
              <label className={formStyles.label}>End</label>
              <input
                type="time"
                name="endTime"
                value={row.endTime || ''}
                onChange={(e) => handleTableRowChange('labour', index, e)}
                className={formStyles.input}
              />
            </div>
            <div>
              <label className={formStyles.label}>Hours</label>
              <input type="number" name="hours" value={row.hours} className={formStyles.readOnlyInput} readOnly />
            </div>
            <div>
              <label className={formStyles.label}>Comments</label>
              <input
                name="comments"
                value={row.comments}
                onChange={(e) => handleTableRowChange('labour', index, e)}
                className={formStyles.input}
              />
            </div>
            <div className="text-right">
              <button onClick={() => removeRow('labour', index)} className={formStyles.removeButton}>
                X
              </button>
            </div>
          </div>
        ))}
        <button onClick={() => addRow('labour')} className={formStyles.button}>
          + Add Crew Member
        </button>
      </div>

      {/* Teeth Usage (Profiling only) */}
      {isProfiling && (
        <div>
          <label htmlFor="teeth-usage" className={formStyles.label}>
            Teeth Usage
          </label>
          <VoiceInput onTextChange={(text) => handleVoiceInput('teethUsage', text)} currentValue={data.teethUsage ?? ''}>
            <textarea
              id="teeth-usage"
              name="teethUsage"
              value={data.teethUsage}
              onChange={handleChange}
              rows={2}
              className={formStyles.textarea}
              placeholder="e.g., Used half a set of teeth..."
            ></textarea>
          </VoiceInput>
        </div>
      )}

      {/* On-Site Testing (NOT for profiling) */}
      {!isProfiling && (
        <div className="space-y-2">
          <h4 className="font-semibold">On-Site Testing</h4>
          {data.onSiteTests.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-[2fr_2fr_1fr_1fr_2fr_auto] items-end gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md"
            >
              <div>
                <label className={formStyles.label}>Test Type</label>
                <input
                  name="testType"
                  value={row.testType}
                  onChange={(e) => handleTableRowChange('onSiteTests', index, e)}
                  className={formStyles.input}
                  placeholder="e.g., NDM, Core"
                />
              </div>
              <div>
                <label className={formStyles.label}>Location</label>
                <input
                  name="location"
                  value={row.location}
                  onChange={(e) => handleTableRowChange('onSiteTests', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label className={formStyles.label}>Result</label>
                <input
                  name="result"
                  value={row.result}
                  onChange={(e) => handleTableRowChange('onSiteTests', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label className={formStyles.label}>Pass/Fail</label>
                <select
                  name="passFail"
                  value={row.passFail}
                  onChange={(e) => handleTableRowChange('onSiteTests', index, e)}
                  className={formStyles.input}
                >
                  <option value="">?</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                </select>
              </div>
              <div>
                <label className={formStyles.label}>Comments</label>
                <input
                  name="comments"
                  value={row.comments}
                  onChange={(e) => handleTableRowChange('onSiteTests', index, e)}
                  className={formStyles.input}
                />
              </div>
              <div className="text-right">
                <button onClick={() => removeRow('onSiteTests', index)} className={formStyles.removeButton}>
                  X
                </button>
              </div>
            </div>
          ))}
          <button onClick={() => addRow('onSiteTests')} className={formStyles.button}>
            + Add Test
          </button>
        </div>
      )}

      {/* Other Comments */}
      <div>
        <label htmlFor="other-comments" className={formStyles.label}>
          Other Comments i.e. Wet Weather, breakdowns, client delays, time restrictions, subcontractors etc.
        </label>
        <VoiceInput onTextChange={(text) => handleVoiceInput('otherComments', text)} currentValue={data.otherComments}>
          <textarea
            id="other-comments"
            name="otherComments"
            value={data.otherComments}
            onChange={handleChange}
            rows={3}
            className={formStyles.textarea}
          ></textarea>
        </VoiceInput>
      </div>
    </div>
  );
};

export default DailyReportForm;
