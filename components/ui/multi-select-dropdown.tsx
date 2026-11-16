'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';

export interface MultiSelectOption {
  label: string;
  value: number | string;
  disabled?: boolean;
}

export interface MultiSelectDropdownProps {
  label?: string;
  required?: boolean;
  options: MultiSelectOption[];
  values: (number | string)[];
  onChange: (newValues: number[]) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  className?: string;
  disabled?: boolean;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  required = false,
  options,
  values,
  onChange,
  placeholder = 'Select branches',
  error,
  helperText,
  containerClassName = '',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Filtered options based on search
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const term = search.toLowerCase().trim();
    return options.filter((opt) => opt.label.toLowerCase().includes(term));
  }, [options, search]);

  // Toggle selection
  const handleToggle = (val: number | string) => {
    const numVal = Number(val);
    const numValues = values.map(Number);
    if (numValues.includes(numVal)) {
      onChange(numValues.filter((v) => v !== numVal));
    } else {
      onChange([...numValues, numVal]);
    }
  };

  // Remove single chip
  const handleRemoveChip = (e: React.MouseEvent, val: number | string) => {
    e.stopPropagation();
    const numVal = Number(val);
    onChange(values.map(Number).filter((v) => v !== numVal));
  };

  // Clear all
  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  // Select all
  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(options.filter((o) => !o.disabled).map((o) => Number(o.value)));
  };

  const selectedOptions = useMemo(() => {
    const numValues = values.map(Number);
    return options.filter((opt) => numValues.includes(Number(opt.value)));
  }, [options, values]);

  const allSelected =
    options.length > 0 && selectedOptions.length === options.length;

  return (
    <div className={`space-y-1.5 w-full relative ${containerClassName}`} ref={containerRef}>
      {/* Label */}
      {label && (
        <label className="text-xs sm:text-sm font-semibold text-gray-800 block">
          {label} {required && <span className="text-[#175C46]">*</span>}
        </label>
      )}

      {/* Main Trigger Box - Fixed h-11 height matching Dropdown and TextInput */}
      <div
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        className={`w-full h-11 px-3 rounded-xl border text-xs sm:text-sm transition-all shadow-2xs font-sans cursor-pointer flex items-center justify-between gap-2 select-none ${
          disabled
            ? 'bg-gray-50/80 border-gray-200/80 text-gray-400 cursor-not-allowed'
            : error
            ? 'bg-white border-rose-400 ring-1 ring-rose-400'
            : isOpen
            ? 'bg-white border-[#175C46] ring-1 ring-[#175C46]'
            : 'bg-white border-gray-200/90 hover:border-gray-300'
        } ${className}`}
      >
        {/* Selected Chips or Placeholder - single row without wrapping */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
          {selectedOptions.length === 0 ? (
            <span className="text-gray-400 truncate select-none">{placeholder}</span>
          ) : allSelected && options.length > 2 ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[#E8F8F0] text-[#175C46] border border-[#175C46]/20 shrink-0">
              All branches selected ({options.length})
            </span>
          ) : selectedOptions.length === 1 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[#E8F8F0] text-[#175C46] border border-[#175C46]/20 shrink-0 max-w-[calc(100%-8px)]">
              <span className="truncate">{selectedOptions[0].label}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => handleRemoveChip(e, selectedOptions[0].value)}
                  className="hover:text-rose-600 transition-colors cursor-pointer text-sm leading-none ml-0.5"
                  title={`Remove ${selectedOptions[0].label}`}
                >
                  &times;
                </button>
              )}
            </span>
          ) : (
            <>
              {/* Show first selected chip */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-[#E8F8F0] text-[#175C46] border border-[#175C46]/20 shrink-0 max-w-[130px] sm:max-w-[150px]">
                <span className="truncate">{selectedOptions[0].label}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveChip(e, selectedOptions[0].value)}
                    className="hover:text-rose-600 transition-colors cursor-pointer text-sm leading-none ml-0.5"
                    title={`Remove ${selectedOptions[0].label}`}
                  >
                    &times;
                  </button>
                )}
              </span>

              {/* Counter badge for remaining selections */}
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 shrink-0 hover:bg-gray-200 transition-colors cursor-pointer select-none"
                title={selectedOptions.map((o) => o.label).join(', ')}
              >
                +{selectedOptions.length - 1} more
              </span>
            </>
          )}
        </div>

        {/* Right Action Icons (Clear all & Chevron) */}
        <div className="flex items-center gap-1 shrink-0 text-gray-400">
          {values.length > 0 && !disabled && (
            <button
              type="button"
              onClick={handleClearAll}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 hover:text-gray-600 text-sm font-bold leading-none cursor-pointer transition-colors"
              title="Clear all branches"
            >
              &times;
            </button>
          )}
          <svg
            className={`w-4 h-4 stroke-current transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#175C46]' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Floating Dropdown Menu Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden py-2 font-sans animation-scale-in">
          {/* Search Input Box */}
          {options.length > 3 && (
            <div className="px-3 pb-2 border-b border-gray-100">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search branches..."
                  className="w-full h-8 pl-8 pr-3 bg-gray-50/70 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:border-[#175C46] transition-all"
                  onClick={(e) => e.stopPropagation()}
                />
                <svg
                  className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Quick Select All / Clear Row */}
          <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-gray-500 border-b border-gray-50 font-medium">
            <span>{values.length} of {options.length} selected</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[#175C46] hover:underline cursor-pointer font-semibold"
              >
                Select all
              </button>
              <span>&bull;</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-gray-500 hover:text-gray-800 cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-gray-50 px-1 py-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">No branches found</div>
            ) : (
              filteredOptions.map((opt) => {
                const isChecked = values.map(Number).includes(Number(opt.value));
                return (
                  <div
                    key={String(opt.value)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!opt.disabled) handleToggle(opt.value);
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors text-xs sm:text-sm select-none ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : isChecked
                        ? 'bg-[#E8F8F0]/40 text-[#175C46] font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{opt.label}</span>

                    {/* Checkbox indicator */}
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                        isChecked
                          ? 'border-[#175C46] bg-[#175C46] text-white shadow-2xs'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isChecked && (
                        <svg
                          className="w-3 h-3 stroke-current"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="3"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Validation Error */}
      {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}

      {/* Helper Text */}
      {!error && helperText && (
        <p className="text-[11px] text-gray-400 mt-1">{helperText}</p>
      )}
    </div>
  );
};


