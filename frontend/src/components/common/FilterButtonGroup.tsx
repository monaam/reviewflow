import React from 'react';
import { formatEnumLabel } from '../../utils/formatters';

export interface FilterOption {
  value: string;
  label?: string; // Optional custom label, defaults to formatted value
}

export interface FilterButtonGroupProps {
  /**
   * Array of filter options (can be strings or objects with value/label)
   */
  options: string[] | FilterOption[];

  /**
   * Currently selected filter value
   */
  value: string;

  /**
   * Callback when filter changes
   */
  onChange: (value: string) => void;

  /**
   * Style variant
   * - default: Gray background with dark text (Projects style)
   * - primary: Primary color background when active (ReviewQueue style)
   */
  variant?: 'default' | 'primary';

  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * Reusable filter button group component
 * Replaces duplicated filter button implementations across 6 files
 */
export const FilterButtonGroup: React.FC<FilterButtonGroupProps> = ({
  options,
  value,
  onChange,
  variant = 'default',
  className = '',
}) => {
  // Normalize options to FilterOption[]
  const normalizedOptions = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: undefined } : opt
  );

  // Format label: "all" -> "All", "pending_review" -> "pending review"
  const getLabel = (option: FilterOption): string => {
    return option.label || formatEnumLabel(option.value);
  };

  const getButtonClasses = (isActive: boolean): string => {
    const baseClasses = 'text-sm font-medium transition-colors';

    if (variant === 'primary') {
      // ReviewQueue/primary style: rounded-lg, gap-2, primary-600 when active
      return `${baseClasses} px-4 py-2 rounded-lg ${
        isActive
          ? 'bg-primary-600 text-white'
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`;
    }

    // Default/gray style: rounded-md, gap-1, gray-900 when active
    return `${baseClasses} px-3 py-1.5 rounded-md ${
      isActive
        ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;
  };

  const containerGap = variant === 'primary' ? 'gap-2' : 'gap-1';

  return (
    <div className={`flex ${containerGap} ${className}`}>
      {normalizedOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={getButtonClasses(value === option.value)}
          type="button"
        >
          {getLabel(option)}
        </button>
      ))}
    </div>
  );
};
