/**
 * MultiSelect Component
 *
 * A reusable multi-select dropdown with search, checkboxes, and chips display.
 * Used throughout the app for selecting equipment, crew, foremen, etc.
 */

import React, { useState, useRef, useEffect } from 'react';

export interface MultiSelectOption {
  id: string;
  label: string;
  sublabel?: string;
  group?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
  searchable?: boolean;
  disabled?: boolean;
  maxHeight?: number;
  groupBy?: boolean;
  showSelectAll?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onChange,
  placeholder = 'Select items...',
  label,
  searchable = true,
  disabled = false,
  maxHeight = 300,
  groupBy = false,
  showSelectAll = true,
  error,
  required = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(search.toLowerCase()) ||
    option.sublabel?.toLowerCase().includes(search.toLowerCase()) ||
    option.id.toLowerCase().includes(search.toLowerCase())
  );

  // Group options if enabled
  const groupedOptions = groupBy
    ? filteredOptions.reduce((acc, option) => {
        const group = option.group || 'Other';
        if (!acc[group]) acc[group] = [];
        acc[group].push(option);
        return acc;
      }, {} as Record<string, MultiSelectOption[]>)
    : { '': filteredOptions };

  // Handle option toggle
  const toggleOption = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    const enabledIds = filteredOptions.filter(o => !o.disabled).map(o => o.id);
    const allSelected = enabledIds.every(id => selected.includes(id));

    if (allSelected) {
      onChange(selected.filter(s => !enabledIds.includes(s)));
    } else {
      const newSelected = [...new Set([...selected, ...enabledIds])];
      onChange(newSelected);
    }
  };

  // Remove a selected item
  const removeItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter(s => s !== id));
  };

  // Get selected options for display
  const selectedOptions = options.filter(o => selected.includes(o.id));

  // Check if all filtered options are selected
  const allFilteredSelected = filteredOptions.length > 0 &&
    filteredOptions.filter(o => !o.disabled).every(o => selected.includes(o.id));

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Selected items display / trigger */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          min-h-[42px] px-3 py-2 border rounded-lg cursor-pointer transition-all
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}
          ${error ? 'border-red-500' : ''}
        `}
      >
        {selectedOptions.length === 0 ? (
          <span className="text-gray-400">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {selectedOptions.slice(0, 5).map(option => (
              <span
                key={option.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {option.icon}
                <span className="truncate max-w-[150px]">{option.label}</span>
                {!disabled && (
                  <button
                    onClick={(e) => removeItem(option.id, e)}
                    className="ml-1 hover:text-blue-600 focus:outline-none"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </span>
            ))}
            {selectedOptions.length > 5 && (
              <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded-full">
                +{selectedOptions.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Dropdown arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown panel */}
      {isOpen && !disabled && (
        <div
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg"
          style={{ maxHeight: maxHeight + 60 }}
        >
          {/* Search input */}
          {searchable && (
            <div className="p-2 border-b border-gray-200">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
          )}

          {/* Select all option */}
          {showSelectAll && filteredOptions.length > 0 && (
            <div className="px-2 py-1 border-b border-gray-200">
              <label className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-gray-50 rounded">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  {allFilteredSelected ? 'Deselect All' : 'Select All'} ({filteredOptions.length})
                </span>
              </label>
            </div>
          )}

          {/* Options list */}
          <div className="overflow-y-auto" style={{ maxHeight }}>
            {Object.entries(groupedOptions).map(([group, groupOptions]) => (
              <div key={group}>
                {groupBy && group && (
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 sticky top-0">
                    {group}
                  </div>
                )}
                {groupOptions.map(option => (
                  <label
                    key={option.id}
                    className={`
                      flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors
                      ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
                      ${selected.includes(option.id) ? 'bg-blue-50' : ''}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(option.id)}
                      onChange={() => !option.disabled && toggleOption(option.id)}
                      disabled={option.disabled}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {option.label}
                      </div>
                      {option.sublabel && (
                        <div className="text-xs text-gray-500 truncate">
                          {option.sublabel}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            ))}

            {filteredOptions.length === 0 && (
              <div className="px-4 py-6 text-sm text-gray-500 text-center">
                No options found
              </div>
            )}
          </div>

          {/* Footer with count */}
          <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
            {selected.length} of {options.length} selected
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default MultiSelect;
