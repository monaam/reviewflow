import { FC } from 'react';
import { FileQuestion } from 'lucide-react';
import { AssetRendererProps } from '../../types/assetTypes';

export const DesignRenderer: FC<AssetRendererProps> = ({
  title,
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400">
      <FileQuestion className="w-24 h-24 mb-4" />
      <p className="text-lg font-medium">{title}</p>
      <p className="text-sm mt-2">Preview not available for this file type</p>
      <p className="text-xs mt-1">Download the file to view it in the appropriate application</p>
    </div>
  );
};
