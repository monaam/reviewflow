import { FC } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AssetVersion } from '../../types';

interface VersionSelectorProps {
  versions: AssetVersion[];
  selectedVersion: number;
  currentVersion: number;
  onVersionSelect: (version: number) => void;
}

/**
 * Version selector component with navigation buttons.
 * Displays all versions as clickable pills with prev/next navigation.
 */
export const VersionSelector: FC<VersionSelectorProps> = ({
  versions,
  selectedVersion,
  currentVersion,
  onVersionSelect,
}) => {
  if (versions.length <= 1) {
    return null;
  }

  return (
    <div className="p-4 bg-gray-800 flex items-center justify-center gap-2">
      <button
        onClick={() => onVersionSelect(Math.max(1, selectedVersion - 1))}
        disabled={selectedVersion === 1}
        className="p-1 hover:bg-gray-700 rounded disabled:opacity-50"
        aria-label="Previous version"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>

      {versions.map((v) => (
        <button
          key={v.version_number}
          onClick={() => onVersionSelect(v.version_number)}
          className={`px-3 py-1 rounded text-sm ${
            selectedVersion === v.version_number
              ? 'bg-primary-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          v{v.version_number}
        </button>
      ))}

      <button
        onClick={() => onVersionSelect(Math.min(currentVersion, selectedVersion + 1))}
        disabled={selectedVersion === currentVersion}
        className="p-1 hover:bg-gray-700 rounded disabled:opacity-50"
        aria-label="Next version"
      >
        <ChevronRight className="w-5 h-5 text-white" />
      </button>
    </div>
  );
};
