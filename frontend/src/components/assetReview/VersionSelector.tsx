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

      {[...versions]
        .sort((a, b) => a.version_number - b.version_number)
        .map((v) => {
          const isSelected = selectedVersion === v.version_number;
          return (
            <button
              key={v.version_number}
              onClick={() => onVersionSelect(v.version_number)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                isSelected
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-200'
              }`}
            >
              v{v.version_number}
            </button>
          );
        })}

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
