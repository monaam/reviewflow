import { FC, useEffect, useCallback, useState, useRef, ReactNode } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { AssetRendererProps } from '../../types/assetTypes';

// Configure the worker from public directory
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

import { PdfFitMode } from '../../types/assetTypes';

interface PdfRendererProps extends AssetRendererProps {
  currentPage?: number;
  zoomLevel?: number;
  fitMode?: PdfFitMode;
  onPageChange?: (page: number) => void;
  onTotalPagesChange?: (totalPages: number) => void;
  /** Overlay to render on top of the PDF page (for annotations) */
  overlay?: ReactNode;
}

export const PdfRenderer: FC<PdfRendererProps> = ({
  fileUrl,
  title,
  mediaRef,
  onLoad,
  currentPage = 1,
  zoomLevel = 1,
  fitMode = 'width',
  onTotalPagesChange,
  overlay,
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Measure container dimensions for responsive sizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);


  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    onTotalPagesChange?.(numPages);
  }, [onTotalPagesChange]);

  // Called when the page actually renders (not just when document loads)
  const onPageRenderSuccess = useCallback(() => {
    // Update mediaRef after page renders
    if (mediaRef && pageRef.current) {
      (mediaRef as React.MutableRefObject<HTMLElement | null>).current = pageRef.current;
    }
    onLoad?.();
  }, [mediaRef, onLoad]);

  // Calculate page dimensions based on fit mode and zoom
  const getPageDimensions = () => {
    if (fitMode === 'width' && containerWidth > 0) {
      return { width: containerWidth * 0.9, height: undefined };
    }
    if (fitMode === 'height' && containerHeight > 0) {
      return { width: undefined, height: containerHeight * 0.9 };
    }
    // Manual zoom mode
    if (containerWidth > 0) {
      return { width: containerWidth * zoomLevel * 0.9, height: undefined };
    }
    return { width: undefined, height: undefined };
  };

  const { width: pageWidth, height: pageHeight } = getPageDimensions();

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-auto flex justify-center"
      aria-label={title}
    >
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        }
        error={
          <div className="flex items-center justify-center h-full text-red-500">
            Failed to load PDF. Please try again.
          </div>
        }
      >
        {numPages && currentPage <= numPages && (
          <div ref={pageRef} className="pdf-page-container relative">
            <Page
              pageNumber={currentPage}
              width={pageWidth}
              height={pageHeight}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onRenderSuccess={onPageRenderSuccess}
            />
            {/* Annotation overlay - rendered inside page container so it scrolls with the page */}
            {overlay}
          </div>
        )}
      </Document>
    </div>
  );
};
