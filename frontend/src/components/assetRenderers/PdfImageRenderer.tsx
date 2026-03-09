import { FC, useEffect, useCallback, useState, useRef, ReactNode } from 'react';
import { AssetRendererProps } from '../../types/assetTypes';
import { PdfFitMode } from '../../types/assetTypes';
import { usePdfPages } from '../../hooks/usePdfPages';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { PdfRenderer } from './PdfRenderer';

interface PdfImageRendererProps extends AssetRendererProps {
  assetId: string;
  versionNumber: number;
  currentPage?: number;
  zoomLevel?: number;
  fitMode?: PdfFitMode;
  onPageChange?: (page: number) => void;
  onTotalPagesChange?: (totalPages: number) => void;
  overlay?: ReactNode;
}

export const PdfImageRenderer: FC<PdfImageRendererProps> = ({
  fileUrl,
  title,
  mediaRef,
  onLoad,
  assetId,
  versionNumber,
  currentPage = 1,
  zoomLevel = 1,
  fitMode = 'width',
  onTotalPagesChange,
  overlay,
}) => {
  const { data, isLoading } = usePdfPages(assetId, versionNumber);
  const [availableWidth, setAvailableWidth] = useState<number>(0);
  const [availableHeight, setAvailableHeight] = useState<number>(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Measure the wrapper (fixed-size parent), not the scrollable content
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setAvailableWidth(entry.contentRect.width);
        setAvailableHeight(entry.contentRect.height);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Report total pages when data is ready
  useEffect(() => {
    if (data?.status === 'completed' && data.total_pages) {
      onTotalPagesChange?.(data.total_pages);
    }
  }, [data?.status, data?.total_pages, onTotalPagesChange]);

  // Update mediaRef when page renders
  const handleImageLoad = useCallback(() => {
    if (mediaRef && pageRef.current) {
      (mediaRef as React.MutableRefObject<HTMLElement | null>).current = pageRef.current;
    }
    onLoad?.();
  }, [mediaRef, onLoad]);

  // Fall back to PDF.js renderer for: failed, unavailable, or legacy PDFs without conversion
  const shouldFallback =
    !isLoading &&
    data &&
    (data.status === 'failed' || data.status === 'unavailable');

  if (shouldFallback) {
    return (
      <PdfRenderer
        fileUrl={fileUrl}
        title={title}
        mediaRef={mediaRef}
        onLoad={onLoad}
        currentPage={currentPage}
        zoomLevel={zoomLevel}
        fitMode={fitMode}
        onTotalPagesChange={onTotalPagesChange}
        overlay={overlay}
      />
    );
  }

  // Loading / processing state
  if (isLoading || !data || data.status === 'pending' || data.status === 'processing') {
    return (
      <div ref={wrapperRef} className="w-full h-full flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-gray-400">
          {data?.status === 'processing' ? 'Converting PDF pages...' : 'Loading PDF...'}
        </p>
      </div>
    );
  }

  // Find the current page data
  const currentPageData = data.pages.find((p) => p.page_number === currentPage);

  if (!currentPageData) {
    return (
      <div ref={wrapperRef} className="w-full h-full flex items-center justify-center text-red-500">
        Page {currentPage} not found.
      </div>
    );
  }

  const aspectRatio = currentPageData.width / currentPageData.height;

  // Calculate display dimensions based on fit mode and zoom
  let displayWidth: number;
  let displayHeight: number;

  if (availableWidth > 0 && availableHeight > 0) {
    if (fitMode === 'width') {
      displayWidth = availableWidth * 0.95;
      displayHeight = displayWidth / aspectRatio;
    } else if (fitMode === 'height') {
      displayHeight = availableHeight * 0.95;
      displayWidth = displayHeight * aspectRatio;
    } else {
      // Manual zoom: zoomLevel 1 = fit width, then scale from there
      displayWidth = availableWidth * zoomLevel * 0.95;
      displayHeight = displayWidth / aspectRatio;
    }
  } else {
    // Not measured yet — use a safe small size, will re-render once measured
    displayWidth = 600;
    displayHeight = 600 / aspectRatio;
  }

  return (
    // Wrapper: takes full space, used only for measuring available area
    <div ref={wrapperRef} className="w-full h-full relative" aria-label={title}>
      {/* Scroll container: positioned absolutely to not affect wrapper measurement */}
      <div className="absolute inset-0 overflow-auto">
        <div
          ref={pageRef}
          className="pdf-page-container relative mx-auto my-2"
          style={{ width: displayWidth, height: displayHeight }}
        >
          <img
            src={currentPageData.image_url}
            alt={`${title} - Page ${currentPage}`}
            width={displayWidth}
            height={displayHeight}
            className="block w-full h-full"
            draggable={false}
            onLoad={handleImageLoad}
          />
          {overlay}
        </div>
      </div>
    </div>
  );
};
