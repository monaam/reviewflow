import { FilterOption } from '../components/common/FilterButtonGroup';

/**
 * Asset status filter options for non-reviewer roles (admin, PM, creative).
 * Includes internal workflow statuses.
 */
export const assetStatusFilters: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'in_review', label: 'In Review' },
  { value: 'client_review', label: 'Client Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'revision_requested', label: 'Revision Requested' },
  { value: 'published', label: 'Published' },
];

/**
 * Asset status filter options for reviewer roles.
 * Excludes internal statuses (pending_review, in_review) that reviewers don't see.
 */
export const reviewerAssetStatusFilters: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'client_review', label: 'Client Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'revision_requested', label: 'Revision Requested' },
  { value: 'published', label: 'Published' },
];

/**
 * Get the appropriate asset status filters based on role.
 */
export function getAssetStatusFilters(isReviewer: boolean): FilterOption[] {
  return isReviewer ? reviewerAssetStatusFilters : assetStatusFilters;
}

/**
 * Get just the status values (without 'all') for a role.
 * Useful for ProjectDetail where labels include counts.
 */
export function getAssetStatusValues(isReviewer: boolean): string[] {
  return getAssetStatusFilters(isReviewer)
    .map((f) => f.value)
    .filter((v) => v !== 'all');
}
