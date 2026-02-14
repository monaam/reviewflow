import { FC, useState, useMemo } from 'react';
import { Modal } from './Modal';
import { Plus, Trash2 } from 'lucide-react';
import { AssetVersion } from '../../types';

interface PublishModalProps {
  onClose: () => void;
  onPublish: (data: { links: { url: string }[]; version: number }) => void;
  versions: AssetVersion[];
  currentVersion: number;
}

const PLATFORM_MAP: Record<string, { label: string; color: string }> = {
  instagram: { label: 'Instagram', color: 'text-pink-500' },
  facebook: { label: 'Facebook', color: 'text-blue-600' },
  twitter: { label: 'X / Twitter', color: 'text-gray-900 dark:text-white' },
  youtube: { label: 'YouTube', color: 'text-red-600' },
  tiktok: { label: 'TikTok', color: 'text-gray-900 dark:text-white' },
  linkedin: { label: 'LinkedIn', color: 'text-blue-700' },
  pinterest: { label: 'Pinterest', color: 'text-red-500' },
  behance: { label: 'Behance', color: 'text-blue-500' },
  dribbble: { label: 'Dribbble', color: 'text-pink-400' },
  vimeo: { label: 'Vimeo', color: 'text-cyan-500' },
  threads: { label: 'Threads', color: 'text-gray-900 dark:text-white' },
  snapchat: { label: 'Snapchat', color: 'text-yellow-400' },
};

function detectPlatform(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    const platforms: Record<string, string> = {
      'instagram.com': 'instagram',
      'facebook.com': 'facebook',
      'fb.com': 'facebook',
      'fb.watch': 'facebook',
      'twitter.com': 'twitter',
      'x.com': 'twitter',
      'youtube.com': 'youtube',
      'youtu.be': 'youtube',
      'tiktok.com': 'tiktok',
      'linkedin.com': 'linkedin',
      'pinterest.com': 'pinterest',
      'pin.it': 'pinterest',
      'behance.net': 'behance',
      'dribbble.com': 'dribbble',
      'vimeo.com': 'vimeo',
      'threads.net': 'threads',
      'snapchat.com': 'snapchat',
    };
    for (const [domain, platform] of Object.entries(platforms)) {
      if (host === domain || host.endsWith('.' + domain)) {
        return platform;
      }
    }
    return null;
  } catch {
    return null;
  }
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
              const platformInfo = platform ? PLATFORM_MAP[platform] : null;

              return (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updateLink(index, e.target.value)}
                      placeholder="https://..."
                      className="input w-full pr-24"
                    />
                    {platformInfo && (
                      <span
                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ${platformInfo.color}`}
                      >
                        {platformInfo.label}
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
