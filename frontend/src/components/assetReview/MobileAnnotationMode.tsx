import { FC, useRef, useCallback, useState } from 'react';
import { X, Check, MapPin } from 'lucide-react';
import { Rectangle } from '../../hooks/useAssetReviewState';

interface MobileAnnotationModeProps {
  mediaRef: React.RefObject<HTMLImageElement | HTMLVideoElement | null>;
  onComplete: (rect: Rectangle) => void;
  onCancel: () => void;
}

export const MobileAnnotationMode: FC<MobileAnnotationModeProps> = ({
  mediaRef,
  onComplete,
  onCancel,
}) => {
  const [currentRect, setCurrentRect] = useState<Rectangle | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const getNormalizedPoint = useCallback((touch: React.Touch) => {
    const bounds = mediaRef.current?.getBoundingClientRect();
    if (!bounds) return null;
    const x = (touch.clientX - bounds.left) / bounds.width;
    const y = (touch.clientY - bounds.top) / bounds.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return null;
    return { x, y };
  }, [mediaRef]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const point = getNormalizedPoint(e.touches[0]);
    if (!point) return;
    startRef.current = point;
    setIsDrawing(true);
    setCurrentRect({ x: point.x, y: point.y, width: 0, height: 0 });
  }, [getNormalizedPoint]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !startRef.current) return;
    const bounds = mediaRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const x = Math.max(0, Math.min(1, (e.touches[0].clientX - bounds.left) / bounds.width));
    const y = Math.max(0, Math.min(1, (e.touches[0].clientY - bounds.top) / bounds.height));
    setCurrentRect({
      x: startRef.current.x,
      y: startRef.current.y,
      width: x - startRef.current.x,
      height: y - startRef.current.y,
    });
  }, [isDrawing, mediaRef]);

  const handleTouchEnd = useCallback(() => {
    setIsDrawing(false);
    if (!currentRect) return;

    // If too small, treat as a tap (pin annotation)
    if (Math.abs(currentRect.width) < 0.02 && Math.abs(currentRect.height) < 0.02) {
      // Create a small pin-sized rect
      const PIN_SIZE = 0.04;
      setCurrentRect({
        x: currentRect.x - PIN_SIZE / 2,
        y: currentRect.y - PIN_SIZE / 2,
        width: PIN_SIZE,
        height: PIN_SIZE,
      });
      return;
    }

    // Normalize
    setCurrentRect({
      x: currentRect.width < 0 ? currentRect.x + currentRect.width : currentRect.x,
      y: currentRect.height < 0 ? currentRect.y + currentRect.height : currentRect.y,
      width: Math.abs(currentRect.width),
      height: Math.abs(currentRect.height),
    });
  }, [currentRect]);

  const handleDone = () => {
    if (currentRect) {
      // Ensure normalized
      const normalized = {
        x: currentRect.width < 0 ? currentRect.x + currentRect.width : currentRect.x,
        y: currentRect.height < 0 ? currentRect.y + currentRect.height : currentRect.y,
        width: Math.abs(currentRect.width),
        height: Math.abs(currentRect.height),
      };
      onComplete(normalized);
    }
  };

  return (
    <>
      {/* Toolbar replacing header */}
      <div className="absolute top-0 inset-x-0 z-50 flex items-center justify-between px-4 h-12 bg-gray-900/90 backdrop-blur-sm">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-sm font-medium text-white/80 active:text-white"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <span className="text-sm font-semibold text-white">Annotate</span>
        <button
          onClick={handleDone}
          disabled={!currentRect || (Math.abs(currentRect.width) < 0.01 && Math.abs(currentRect.height) < 0.01)}
          className="flex items-center gap-1.5 text-sm font-medium text-primary-400 disabled:text-white/30 active:text-primary-300"
        >
          <Check className="w-4 h-4" />
          Done
        </button>
      </div>

      {/* Touch overlay on the preview */}
      <div
        className="absolute inset-0 z-40"
        style={{ touchAction: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Render the current drawing rectangle */}
        {currentRect && (
          <div
            className="absolute border-2 border-primary-400 bg-primary-400/20 rounded-sm"
            style={{
              left: `${(currentRect.width < 0 ? currentRect.x + currentRect.width : currentRect.x) * 100}%`,
              top: `${(currentRect.height < 0 ? currentRect.y + currentRect.height : currentRect.y) * 100}%`,
              width: `${Math.abs(currentRect.width) * 100}%`,
              height: `${Math.abs(currentRect.height) * 100}%`,
            }}
          />
        )}
      </div>

      {/* Bottom instruction bar */}
      <div className="absolute bottom-0 inset-x-0 z-50 px-4 py-3 bg-gray-900/90 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2 text-sm text-white/70">
          <MapPin className="w-4 h-4" />
          {currentRect && (Math.abs(currentRect.width) > 0.01 || Math.abs(currentRect.height) > 0.01)
            ? 'Annotation drawn. Tap Done to confirm.'
            : 'Tap to pin or drag to draw a region'}
        </div>
      </div>
    </>
  );
};
