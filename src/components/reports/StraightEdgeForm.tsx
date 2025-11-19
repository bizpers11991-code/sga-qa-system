import React, { useState, useEffect } from 'react';
import { StraightEdgeData, StraightEdgeRow } from '../../types';

interface StraightEdgeFormProps {
  initialData: StraightEdgeData;
  onUpdate: (data: StraightEdgeData) => void;
}

const formStyles = {
  input:
    'w-full px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sga-500 focus:border-sga-500',
  label: 'block text-sm font-medium text-gray-700 mb-1',
  button: 'px-3 py-1 text-sm font-semibold text-white bg-sga-700 rounded-md hover:bg-sga-800',
  removeButton: 'px-2 py-1 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700',
};

export const StraightEdgeForm: React.FC<StraightEdgeFormProps> = ({ initialData, onUpdate }) => {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    onUpdate(data);
  }, [data, onUpdate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTableRowChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const list = [...data.tests];
    list[index] = { ...list[index], [name]: value };
    setData((prev) => ({ ...prev, tests: list }));
  };

  const addRow = () => {
    const newRow: StraightEdgeRow = { runLane: '', chainage: '', transverse: '', join: '', longitudinal: '' };
    setData((prev) => ({ ...prev, tests: [...prev.tests, newRow] }));
  };

  const removeRow = (index: number) => {
    const list = data.tests.filter((_, i) => i !== index);
    setData((prev) => ({ ...prev, tests: list }));
  };

  return (
    <div className="p-6 space-y-6 bg-white border border-gray-200 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-sga-700">Straight Edge Testing</h3>

      {/* Header Fields */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="se-lotNo" className={formStyles.label}>
            Lot No
          </label>
          <input
            id="se-lotNo"
            type="text"
            name="lotNo"
            value={data.lotNo}
            onChange={handleChange}
            className={formStyles.input}
          />
        </div>
        <div>
          <label htmlFor="se-mixType" className={formStyles.label}>
            Mix Type
          </label>
          <input
            id="se-mixType"
            type="text"
            name="mixType"
            value={data.mixType}
            onChange={handleChange}
            className={formStyles.input}
          />
        </div>
        <div>
          <label htmlFor="se-testedBy" className={formStyles.label}>
            Tested By
          </label>
          <input
            id="se-testedBy"
            type="text"
            name="testedBy"
            value={data.testedBy}
            onChange={handleChange}
            className={formStyles.input}
          />
        </div>
        <div>
          <label htmlFor="se-straightEdgeId" className={formStyles.label}>
            Straight Edge ID
          </label>
          <input
            id="se-straightEdgeId"
            type="text"
            name="straightEdgeId"
            value={data.straightEdgeId}
            onChange={handleChange}
            className={formStyles.input}
          />
        </div>
      </div>

      {/* Testing Table */}
      <div className="space-y-2">
        <h4 className="font-semibold">Test Results</h4>
        {data.tests.map((row, index) => (
          <div
            key={index}
            className="grid items-end grid-cols-6 gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md"
          >
            <div className="grid grid-cols-5 col-span-5 gap-2">
              <div>
                <label htmlFor={`se-runLane-${index}`} className={formStyles.label}>
                  Run / Lane
                </label>
                <input
                  id={`se-runLane-${index}`}
                  name="runLane"
                  value={row.runLane}
                  onChange={(e) => handleTableRowChange(index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label htmlFor={`se-chainage-${index}`} className={formStyles.label}>
                  Chainage
                </label>
                <input
                  id={`se-chainage-${index}`}
                  name="chainage"
                  value={row.chainage}
                  onChange={(e) => handleTableRowChange(index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label htmlFor={`se-transverse-${index}`} className={formStyles.label}>
                  Transverse
                </label>
                <input
                  id={`se-transverse-${index}`}
                  name="transverse"
                  value={row.transverse}
                  onChange={(e) => handleTableRowChange(index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label htmlFor={`se-join-${index}`} className={formStyles.label}>
                  Join
                </label>
                <input
                  id={`se-join-${index}`}
                  name="join"
                  value={row.join}
                  onChange={(e) => handleTableRowChange(index, e)}
                  className={formStyles.input}
                />
              </div>
              <div>
                <label htmlFor={`se-longitudinal-${index}`} className={formStyles.label}>
                  Longitudinal
                </label>
                <input
                  id={`se-longitudinal-${index}`}
                  name="longitudinal"
                  value={row.longitudinal}
                  onChange={(e) => handleTableRowChange(index, e)}
                  className={formStyles.input}
                />
              </div>
            </div>
            <div className="text-right">
              <button onClick={() => removeRow(index)} className={formStyles.removeButton}>
                X
              </button>
            </div>
          </div>
        ))}
        <button onClick={addRow} className={formStyles.button}>
          + Add Test Row
        </button>
      </div>

      {/* Supervisor */}
      <div>
        <label htmlFor="se-supervisor" className={formStyles.label}>
          Checked By (Supervisor)
        </label>
        <input
          id="se-supervisor"
          type="text"
          name="supervisor"
          value={data.supervisor}
          onChange={handleChange}
          className={formStyles.input}
        />
      </div>
    </div>
  );
};

export default StraightEdgeForm;
