import { FC, useCallback } from 'react';
import { AssetRendererProps } from '../../types/assetTypes';

export const ImageRenderer: FC<AssetRendererProps> = ({
  fileUrl,
  title,
  mediaRef,
  onLoad,
}) => {
  const handleLoad = useCallback(() => {
    onLoad?.();
  }, [onLoad]);

  return (
    <img
      ref={mediaRef as React.RefObject<HTMLImageElement>}
      src={fileUrl}
      alt={title}
      className="max-w-full max-h-full object-contain"
      draggable={false}
      onLoad={handleLoad}
    />
  );
};
