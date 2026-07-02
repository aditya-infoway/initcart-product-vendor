import React, { useState, useEffect, useRef } from 'react';

interface MultiSelectProps {
  options: Array<{ value: number | string; label: string }>;
  selectedValues: Array<number | string>;
  onChange: (values: Array<number | string>) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options = [],
  selectedValues = [],
  onChange,
  placeholder = "Select...",
  disabled = false,
  error = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (value: number | string) => {
    let newSelected: Array<number | string>;
    if (selectedValues.includes(value)) {
      // Remove if already selected
      newSelected = selectedValues.filter(v => v !== value);
    } else {
      // Add if not selected
      newSelected = [...selectedValues, value];
    }
    onChange(newSelected);
  };

  const handleRemove = (value: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = selectedValues.filter(v => v !== value);
    onChange(newSelected);
  };

  const getSelectedLabels = () => {
    return selectedValues.map(value => {
      const option = options.find(opt => opt.value === value);
      return option ? option.label : String(value);
    });
  };

  const selectedLabels = getSelectedLabels();

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`w-full border rounded px-3 py-2 cursor-pointer min-h-[42px] flex flex-wrap gap-1 items-center ${disabled ? 'bg-gray-100' : 'bg-white'} ${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : error ? 'border-red-500' : 'border-gray-300'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {selectedLabels.length === 0 ? (
          <span className="text-gray-500">{placeholder}</span>
        ) : (
          <>
            {selectedLabels.slice(0, 3).map((label, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center gap-1"
              >
                {label}
                <button
                  type="button"
                  onClick={(e) => handleRemove(selectedValues[index], e)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
            {selectedLabels.length > 3 && (
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                +{selectedLabels.length - 3} more
              </span>
            )}
          </>
        )}
        <div className="ml-auto">
          <svg
            className={`w-4 h-4 text-gray-500 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
          {/* Search input */}
          <div className="sticky top-0 bg-white p-2 border-b">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-2 py-1 border rounded text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options list */}
          <div className="py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-sm">No options found</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`px-3 py-2 cursor-pointer hover:bg-blue-50 flex items-center justify-between ${selectedValues.includes(option.value) ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSelect(option.value)}
                >
                  <span className="text-sm">{option.label}</span>
                  {selectedValues.includes(option.value) && (
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Select all/none buttons */}
          {options.length > 0 && (
            <div className="sticky bottom-0 bg-gray-50 border-t px-3 py-2 flex justify-between text-sm">
              <button
                type="button"
                className="text-blue-600 hover:text-blue-800"
                onClick={() => {
                  const allValues = options.map(opt => opt.value);
                  onChange(allValues);
                }}
              >
                Select All
              </button>
              <button
                type="button"
                className="text-red-600 hover:text-red-800"
                onClick={() => onChange([])}
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;