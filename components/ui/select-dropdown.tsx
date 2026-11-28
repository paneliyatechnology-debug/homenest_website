'use client';

import React, { useState, useRef, useEffect, useId, useCallback } from 'react';

export interface DropdownOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface DropdownProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  required?: boolean;
  options?: DropdownOption[];
  placeholder?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  rightBadge?: React.ReactNode;
}

export const Dropdown = React.forwardRef<HTMLSelectElement, DropdownProps>(
  (
    {
      label,
      required = false,
      options,
      placeholder,
      error,
      helperText,
      containerClassName = '',
      className = '',
      children,
      disabled = false,
      id,
      value,
      defaultValue,
      onChange,
      rightBadge,
      ...props
    },
    ref
  ) => {
    const rawId = useId();
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : `dropdown_${rawId.replace(/[^a-zA-Z0-9_-]/g, '_')}`);
    const buttonId = `${selectId}-btn`;
    const nativeSelectRef = useRef<HTMLSelectElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);

    // Merge external forwarded ref with internal ref
    const setRefs = useCallback(
      (element: HTMLSelectElement | null) => {
        nativeSelectRef.current = element;
        if (typeof ref === 'function') {
          ref(element);
        } else if (ref && 'current' in ref) {
          (ref as React.MutableRefObject<HTMLSelectElement | null>).current = element;
        }
      },
      [ref]
    );

    // Close dropdown on outside click
    useEffect(() => {
      if (!isOpen) return;
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
      if (!isOpen) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Compute active display label
    const selectedOption = options?.find((opt) => String(opt.value) === String(value));
    const currentDisplayLabel = selectedOption ? selectedOption.label : (placeholder || '');
    const isPlaceholderSelected = !selectedOption && Boolean(placeholder);

    // Handler when user clicks an option in custom floating menu
    const handleSelectOption = (opt: DropdownOption) => {
      if (opt.disabled || disabled) return;
      setIsOpen(false);

      if (nativeSelectRef.current) {
        nativeSelectRef.current.value = String(opt.value);
        // Dispatch standard synthetic change event for React listeners
        const event = new Event('change', { bubbles: true });
        nativeSelectRef.current.dispatchEvent(event);
      }

      if (onChange) {
        const syntheticEvent = {
          target: {
            value: opt.value,
            name: props.name || selectId,
          },
          currentTarget: {
            value: opt.value,
            name: props.name || selectId,
          },
        } as unknown as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
    };

    const handleButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    // If options are provided, render custom pretty floating dropdown
    const hasOptionsArray = Boolean(options && Array.isArray(options));

    return (
      <div ref={containerRef} className={`space-y-1.5 w-full relative ${containerClassName}`}>
        {/* Label & Optional Right Badge */}
        {(label || rightBadge) && (
          <div className="flex items-center justify-between">
            {label && (
              <label
                htmlFor={buttonId}
                className="text-xs sm:text-sm font-semibold text-gray-800 block cursor-pointer truncate"
              >
                {label} {required && <span className="text-red-500 font-bold">*</span>}
              </label>
            )}
            {rightBadge && <div>{rightBadge}</div>}
          </div>
        )}

        {/* Hidden but functional native select for React forms / form actions */}
        <select
          ref={setRefs}
          id={selectId}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          onChange={onChange}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only opacity-0 absolute pointer-events-none"
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => (
                <option key={String(opt.value)} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        {/* Custom Pretty Dropdown Trigger */}
        {hasOptionsArray ? (
          <div className="relative w-full">
            <button
              type="button"
              id={buttonId}
              disabled={disabled}
              onClick={() => setIsOpen((prev) => !prev)}
              onKeyDown={handleButtonKeyDown}
              aria-haspopup="listbox"
              aria-expanded={isOpen}
              className={`w-full h-10 sm:h-11 pl-3.5 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-2.5 rounded-xl border text-xs sm:text-sm text-left transition-all duration-150 shadow-2xs font-sans flex items-center justify-between cursor-pointer outline-none select-none ${
                disabled
                  ? 'bg-gray-50/80 border-gray-200/80 text-gray-400 cursor-not-allowed'
                  : error
                  ? 'bg-white border-rose-400 focus:border-rose-500 ring-1 ring-rose-500/20'
                  : isOpen
                  ? 'bg-white border-[#175C46] ring-2 ring-[#175C46]/20 shadow-xs'
                  : 'bg-white border-gray-200/90 hover:border-gray-300 hover:bg-gray-50/30'
              } ${className}`}
            >
              <span className={`truncate block ${isPlaceholderSelected ? 'text-gray-400' : 'text-gray-800 font-medium'}`}>
                {currentDisplayLabel || placeholder || 'Select an option'}
              </span>

              {/* Styled Chevron Icon */}
              <div
                className={`absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-[#175C46]' : 'text-gray-400'
                }`}
              >
                <svg
                  className="w-4 h-4 stroke-current"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Custom Pretty Floating Menu */}
            {isOpen && !disabled && (
              <div
                role="listbox"
                className="absolute left-0 top-full mt-1.5 w-full min-w-[160px] bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden py-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 divide-y divide-gray-50"
              >
                {placeholder && (
                  <div
                    onClick={() => handleSelectOption({ label: placeholder, value: '' })}
                    className="px-3.5 py-2.5 text-xs sm:text-sm text-gray-400 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    {placeholder}
                  </div>
                )}

                {options!.map((opt) => {
                  const isSelected = String(opt.value) === String(value);
                  return (
                    <div
                      key={String(opt.value)}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectOption(opt)}
                      className={`px-3.5 py-2.5 text-xs sm:text-sm font-medium transition-colors flex items-center justify-between cursor-pointer select-none ${
                        opt.disabled
                          ? 'opacity-40 cursor-not-allowed bg-gray-50/50 text-gray-400'
                          : isSelected
                          ? 'bg-[#E8F8F0] text-[#175C46] font-semibold'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && (
                        <svg
                          className="w-4 h-4 text-[#175C46] stroke-current shrink-0 ml-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2.5"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Graceful fallback if caller used raw <option> children */
          <div className="relative w-full">
            <select
              ref={setRefs}
              id={selectId}
              value={value}
              defaultValue={defaultValue}
              disabled={disabled}
              onChange={onChange}
              className={`w-full h-11 pl-4 pr-10 py-2.5 rounded-xl border text-xs sm:text-sm transition-all shadow-2xs font-sans appearance-none cursor-pointer outline-none ${
                isPlaceholderSelected ? 'text-gray-400' : 'text-gray-800'
              } ${
                disabled
                  ? 'bg-gray-50/80 border-gray-200/80 text-gray-400 cursor-not-allowed select-none'
                  : error
                  ? 'bg-white border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                  : 'bg-white border-gray-200/90 hover:border-gray-300 focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46]'
              } ${className}`}
              {...props}
            >
              {placeholder && (
                <option value="" disabled className="text-gray-400">
                  {placeholder}
                </option>
              )}
              {children}
            </select>

            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center text-gray-400">
              <svg
                className="w-4 h-4 stroke-current transition-transform duration-200"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}

        {/* Validation Error Message */}
        {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}

        {/* Helper Text */}
        {!error && helperText && (
          <p className="text-[11px] text-gray-400 mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Dropdown.displayName = 'Dropdown';

export const SelectDropdown = Dropdown;
