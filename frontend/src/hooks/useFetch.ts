import { useState, useEffect, useRef, useCallback } from 'react';

interface UseFetchOptions<T> {
  fetcher: () => Promise<T>;
  deps?: unknown[];
  initial: T;
  enabled?: boolean;
}

interface UseFetchReturn<T> {
  data: T;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useFetch<T>({
  fetcher,
  deps = [],
  initial,
  enabled = true,
}: UseFetchOptions<T>): UseFetchReturn<T> {
  const [data, setData] = useState<T>(initial);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);

  // Keep fetcher ref up-to-date to avoid stale closures
  fetcherRef.current = fetcher;

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (err) {
      console.error('useFetch error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  return { data, isLoading, error, refetch };
}
