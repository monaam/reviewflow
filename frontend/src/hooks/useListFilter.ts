import { useMemo } from 'react';

export interface UseListFilterOptions<T> {
  /**
   * Array of items to filter
   */
  items: T[];

  /**
   * Search query string
   */
  searchQuery: string;

  /**
   * Function to extract searchable text from an item
   * Return an array of strings to search across multiple fields
   */
  searchFields: (item: T) => (string | undefined | null)[];

  /**
   * Optional status filter value
   */
  statusFilter?: string;

  /**
   * Optional function to extract status from an item
   * Required if statusFilter is provided
   */
  getStatus?: (item: T) => string;
}

/**
 * Generic hook for filtering lists with search and status
 * Replaces duplicated filter logic across 6+ files
 *
 * @example
 * ```tsx
 * const filteredProjects = useListFilter({
 *   items: projects,
 *   searchQuery,
 *   searchFields: (p) => [p.name, p.client_name, p.description],
 * });
 * ```
 *
 * @example
 * ```tsx
 * const filteredAssets = useListFilter({
 *   items: assets,
 *   searchQuery,
 *   searchFields: (a) => [a.title, a.project?.name, a.uploader?.name],
 *   statusFilter,
 *   getStatus: (a) => a.status,
 * });
 * ```
 */
export function useListFilter<T>({
  items,
  searchQuery,
  searchFields,
  statusFilter,
  getStatus,
}: UseListFilterOptions<T>): T[] {
  return useMemo(() => {
    return items.filter((item) => {
      // Search filtering
      const matchesSearch =
        !searchQuery ||
        searchFields(item).some((field) => {
          if (!field) return false;
          return field.toLowerCase().includes(searchQuery.toLowerCase());
        });

      // Status filtering
      const matchesStatus =
        !statusFilter ||
        statusFilter === 'all' ||
        !getStatus ||
        getStatus(item) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, searchQuery, searchFields, statusFilter, getStatus]);
}
