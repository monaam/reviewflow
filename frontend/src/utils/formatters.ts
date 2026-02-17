/**
 * Format enum-like string values for display
 * Converts underscore_case to space-separated words
 *
 * @example
 * formatEnumLabel('pending_review') // 'pending review'
 * formatEnumLabel('in_review') // 'in review'
 * formatEnumLabel('on_hold') // 'on hold'
 * formatEnumLabel('all') // 'All'
 */
export function formatEnumLabel(value: string): string {
  if (value === 'all') return 'All';
  return value.replace(/_/g, ' ');
}

/**
 * Format enum-like string values for display with capitalization
 * Converts underscore_case to Title Case
 *
 * @example
 * formatEnumLabelCapitalized('pending_review') // 'Pending Review'
 * formatEnumLabelCapitalized('in_review') // 'In Review'
 * formatEnumLabelCapitalized('on_hold') // 'On Hold'
 */
export function formatEnumLabelCapitalized(value: string): string {
  return formatEnumLabel(value)
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Check if a deadline has passed and the item is not in a terminal status.
 * Use for creative requests and any deadline-bearing entities.
 */
export function isOverdue(
  deadline: string | Date,
  status?: string,
  terminalStatuses: string[] = ['completed', 'cancelled'],
): boolean {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const isPastDeadline = deadlineDate < new Date();
  if (!status) return isPastDeadline;
  return isPastDeadline && !terminalStatuses.includes(status);
}
