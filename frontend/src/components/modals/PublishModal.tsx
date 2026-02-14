import { FC, useState, useMemo } from 'react';
import { Modal } from './Modal';
import { Plus, Trash2 } from 'lucide-react';
import { AssetVersion } from '../../types';
import { detectPlatform, getPlatformInfo } from '../../config/platformIcons';

interface PublishModalProps {
  onClose: () => void;
  onPublish: (data: { links: { url: string }[]; version: number }) => void;
  versions: AssetVersion[];
  currentVersion: number;
}

export const PublishModal: FC<PublishModalProps> = ({
  onClose,
  onPublish,
  versions,
  currentVersion,
}) => {
  const [selectedVersion, setSelectedVersion] = useState(currentVersion);
  const [links, setLinks] = useState<string[]>(['']);

  const detectedPlatforms = useMemo(
    () => links.map((url) => (url.trim() ? detectPlatform(url.trim()) : null)),
    [links]
  );

  const addLink = () => setLinks([...links, '']);

  const removeLink = (index: number) => {
    if (links.length <= 1) return;
    setLinks(links.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, value: string) => {
    const updated = [...links];
    updated[index] = value;
    setLinks(updated);
  };

  const validLinks = links.filter((url) => {
    try {
      new URL(url.trim());
      return true;
    } catch {
      return false;
    }
  });

  const canSubmit = validLinks.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onPublish({
      links: validLinks.map((url) => ({ url: url.trim() })),
      version: selectedVersion,
    });
  };

  return (
    <Modal title="Publish Asset" onClose={onClose} maxWidth="lg">
      <div className="space-y-5">
        {/* Version Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Published Version
          </label>
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(Number(e.target.value))}
            className="input"
          >
            {versions
              .slice()
              .sort((a, b) => b.version_number - a.version_number)
              .map((v) => (
                <option key={v.version_number} value={v.version_number}>
                  Version {v.version_number}
                  {v.version_number === currentVersion ? ' (current)' : ''}
                </option>
              ))}
          </select>
        </div>

        {/* Links */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Published Links
          </label>
          <div className="space-y-2">
            {links.map((url, index) => {
              const platform = detectedPlatforms[index];
              const hasUrl = url.trim().length > 0;
              const info = hasUrl ? getPlatformInfo(platform) : null;
              const Icon = info?.icon;

              return (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updateLink(index, e.target.value)}
                      placeholder="https://..."
                      className={`input w-full ${info ? 'pl-9' : ''}`}
                    />
                    {info && Icon && (
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${info.color}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  {links.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLink(index)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={addLink}
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add another link
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Publish
        </button>
      </div>
    </Modal>
  );
};
