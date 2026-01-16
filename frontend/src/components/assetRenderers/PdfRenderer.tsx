import { FC } from 'react';
import { AssetRendererProps } from '../../types/assetTypes';

export const PdfRenderer: FC<AssetRendererProps> = ({
  fileUrl,
  title,
}) => {
  return (
    <iframe
      src={fileUrl}
      className="w-full h-full"
      title={title}
    />
  );
};
