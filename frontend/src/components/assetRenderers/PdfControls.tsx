import { FC, useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, MoveHorizontal, MoveVertical } from 'lucide-react';
import { PdfControlsProps } from '../../types/assetTypes';

const ZOOM_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const PdfControls: FC<PdfControlsProps> = ({
  currentPage,
  totalPages,
  zoomLevel,
  fitMode,
  onPageChange,
  onZoomChange,
  onFitModeChange,
}) => {
  const [pageInput, setPageInput] = useState(currentPage.toString());

  // Sync page input with current page
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, onPageChange]);

  const handlePageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  }, []);

  const handlePageInputBlur = useCallback(() => {
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
    } else {
      setPageInput(currentPage.toString());
    }
  }, [pageInput, currentPage, totalPages, onPageChange]);

  const handlePageInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageInputBlur();
    }
  }, [handlePageInputBlur]);

  const handleZoomIn = useCallback(() => {
    const currentIndex = ZOOM_PRESETS.findIndex(z => z >= zoomLevel);
    if (currentIndex < ZOOM_PRESETS.length - 1) {
      onZoomChange(ZOOM_PRESETS[currentIndex + 1]);
    } else if (currentIndex === -1) {
      onZoomChange(ZOOM_PRESETS[ZOOM_PRESETS.length - 1]);
    }
  }, [zoomLevel, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    const currentIndex = ZOOM_PRESETS.findIndex(z => z >= zoomLevel);
    if (currentIndex > 0) {
      onZoomChange(ZOOM_PRESETS[currentIndex - 1]);
    } else if (currentIndex === -1 || currentIndex === 0) {
      onZoomChange(ZOOM_PRESETS[0]);
    }
  }, [zoomLevel, onZoomChange]);

  const handleFitWidth = useCallback(() => {
    onFitModeChange('width');
  }, [onFitModeChange]);

  const handleFitHeight = useCallback(() => {
    onFitModeChange('height');
  }, [onFitModeChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          handlePreviousPage();
          break;
        case 'ArrowRight':
          handleNextPage();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePreviousPage, handleNextPage, handleZoomIn, handleZoomOut]);

  return (
    <div className="p-4 bg-gray-800 flex items-center justify-between gap-4 relative z-20">
      {/* Page Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePreviousPage}
          disabled={currentPage <= 1}
          className="p-2 hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous page (Left arrow)"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        <div className="flex items-center gap-2 text-white text-sm">
          <span>Page</span>
          <input
            type="text"
            value={pageInput}
            onChange={handlePageInputChange}
            onBlur={handlePageInputBlur}
            onKeyDown={handlePageInputKeyDown}
            className="w-12 px-2 py-1 bg-gray-700 rounded text-center text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <span>of {totalPages}</span>
        </div>

        <button
          onClick={handleNextPage}
          disabled={currentPage >= totalPages}
          className="p-2 hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next page (Right arrow)"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleZoomOut}
          disabled={zoomLevel <= ZOOM_PRESETS[0]}
          className="p-2 hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Zoom out (-)"
        >
          <ZoomOut className="w-5 h-5 text-white" />
        </button>

        <span className="text-white text-sm w-16 text-center">
          {Math.round(zoomLevel * 100)}%
        </span>

        <button
          onClick={handleZoomIn}
          disabled={zoomLevel >= ZOOM_PRESETS[ZOOM_PRESETS.length - 1]}
          className="p-2 hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Zoom in (+)"
        >
          <ZoomIn className="w-5 h-5 text-white" />
        </button>

        <div className="w-px h-6 bg-gray-600 mx-1" />

        <button
          onClick={handleFitWidth}
          className={`p-2 rounded ${fitMode === 'width' ? 'bg-primary-600' : 'hover:bg-gray-700'}`}
          title="Fit to width"
        >
          <MoveHorizontal className="w-5 h-5 text-white" />
        </button>

        <button
          onClick={handleFitHeight}
          className={`p-2 rounded ${fitMode === 'height' ? 'bg-primary-600' : 'hover:bg-gray-700'}`}
          title="Fit to height"
        >
          <MoveVertical className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
};
