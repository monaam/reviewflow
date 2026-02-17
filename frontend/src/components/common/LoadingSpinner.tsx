import React from 'react';

export interface LoadingSpinnerProps {
  /**
   * Size variant of the spinner
   * - sm: 20px (h-5 w-5) or 24px (h-6 w-6)
   * - md: 32px (h-8 w-8)
   * - lg: 48px (h-12 w-12)
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Color variant
   * - primary: primary-600 color
   * - gray: gray colors with dual-tone effect
   * - blue: blue-600 color
   */
  variant?: 'primary' | 'gray' | 'blue';

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable loading spinner component
 * Consolidates 20+ inline spinner implementations across the codebase
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const variantClasses = {
    primary: 'border-b-2 border-primary-600',
    gray: 'border-2 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-100',
    blue: 'border-b-2 border-blue-600',
  };

  // For gray variant with medium/large size, use border-2 for better visual weight
  const borderStyle = variant === 'gray' ? variantClasses.gray : variantClasses[variant];

  return (
    <div
      className={`animate-spin rounded-full ${sizeClasses[size]} ${borderStyle} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
