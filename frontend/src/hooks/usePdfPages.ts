import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../api/client';

export interface PdfPageData {
  page_number: number;
  image_url: string;
  width: number;
  height: number;
}

export interface PdfPagesResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'unavailable';
  total_pages: number | null;
  pages: PdfPageData[];
}

export function usePdfPages(assetId: string, versionNumber: number, enabled = true) {
  const [data, setData] = useState<PdfPagesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchPages = async () => {
      try {
        const { data: response } = await apiClient.get<PdfPagesResponse>(
          `/assets/${assetId}/versions/${versionNumber}/pages`
        );

        if (cancelled) return;

        setData(response);
        setIsLoading(false);

        // Stop polling once completed or failed
        if (response.status === 'completed' || response.status === 'failed' || response.status === 'unavailable') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch {
        if (cancelled) return;
        setData({ status: 'failed', total_pages: null, pages: [] });
        setIsLoading(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    // Initial fetch
    fetchPages();

    // Poll every 3s
    intervalRef.current = setInterval(fetchPages, 3000);

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [assetId, versionNumber, enabled]);

  return { data, isLoading };
}
