'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export function Select({ options, value, onChange, placeholder = 'Select...', label }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-muted mb-2">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full px-4 py-2 bg-card border border-border rounded-lg text-left',
          'flex items-center justify-between',
          'focus:outline-none focus:border-blue-500 transition-colors'
        )}
      >
        <span className={selectedOption ? 'text-white' : 'text-muted'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted transition-transform',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>
      
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full px-4 py-2 text-left hover:bg-white/5 transition-colors',
                  value === option.value && 'bg-white/10 text-white',
                  value !== option.value && 'text-muted'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  label?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label,
}: DateRangePickerProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-muted mb-2">{label}</label>
      )}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="px-4 py-2 bg-card border border-border rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
        />
        <span className="text-muted">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="px-4 py-2 bg-card border border-border rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>
    </div>
  );
}
