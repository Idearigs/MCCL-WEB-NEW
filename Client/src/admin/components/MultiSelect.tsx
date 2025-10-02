import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

interface Option {
  id: string;
  name: string;
  color_code?: string;
  price_multiplier?: number;
  price_per_carat?: number;
}

interface MultiSelectProps {
  options: Option[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showColorIndicator?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedIds,
  onChange,
  placeholder = 'Select options...',
  disabled = false,
  className = '',
  showColorIndicator = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOptions = options.filter(option => selectedIds?.includes(option.id));

  const toggleOption = (optionId: string) => {
    if (selectedIds?.includes(optionId)) {
      onChange(selectedIds.filter(id => id !== optionId));
    } else {
      onChange([...(selectedIds || []), optionId]);
    }
  };

  const removeOption = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange((selectedIds || []).filter(id => id !== optionId));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className={`
          min-h-[42px] w-full px-3 py-2 border border-gray-300 rounded-lg
          focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent
          cursor-pointer bg-white
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1 flex-1 min-h-[24px]">
            {selectedOptions.length === 0 ? (
              <span className="text-gray-500 text-sm">{placeholder}</span>
            ) : (
              selectedOptions.map(option => (
                <span
                  key={option.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                >
                  {showColorIndicator && option.color_code && (
                    <div
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: option.color_code }}
                    />
                  )}
                  <span>{option.name}</span>
                  {!disabled && (
                    <button
                      onClick={(e) => removeOption(option.id, e)}
                      className="ml-1 hover:text-blue-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </span>
              ))
            )}
          </div>
          <div className="flex items-center gap-2 ml-2">
            {selectedOptions.length > 0 && !disabled && (
              <button
                onClick={clearAll}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-gray-500 text-sm">No options available</div>
          ) : (
            options.map(option => {
              const isSelected = selectedIds?.includes(option.id);
              return (
                <div
                  key={option.id}
                  className={`
                    px-3 py-2 cursor-pointer flex items-center justify-between
                    hover:bg-gray-50 transition-colors
                    ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                  `}
                  onClick={() => toggleOption(option.id)}
                >
                  <div className="flex items-center gap-2">
                    {showColorIndicator && option.color_code && (
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: option.color_code }}
                      />
                    )}
                    <span className="text-sm">{option.name}</span>
                    {option.price_multiplier && (
                      <span className="text-xs text-gray-500">
                        ({option.price_multiplier}x)
                      </span>
                    )}
                    {option.price_per_carat && (
                      <span className="text-xs text-gray-500">
                        (£{option.price_per_carat}/carat)
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check size={16} className="text-blue-600" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;