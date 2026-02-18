import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps {
  /**
   * Current search query value
   */
  value: string;

  /**
   * Callback when search value changes
   */
  onChange: (value: string) => void;

  /**
   * Placeholder text for the input
   */
  placeholder?: string;

  /**
   * Additional CSS classes for the wrapper
   */
  className?: string;
}

/**
 * Reusable search input component with icon and clear button
 * Replaces duplicated search pattern across 6 files
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}) => {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={`relative flex-1 max-w-md ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input pl-10 pr-10"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
