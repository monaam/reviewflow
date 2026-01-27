import { useState, useEffect } from 'react';
import { Clock, Upload, CheckCircle, XCircle, Lock, Unlock, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { assetsApi } from '../../api/assets';
import { TimelineEvent, VersionHistoryResponse, User } from '../../types';

interface VersionTimelineProps {
  assetId: string;
  onVersionSelect?: (version: number) => void;
  currentVersion?: number;
}

export default function VersionTimeline({ assetId, onVersionSelect, currentVersion }: VersionTimelineProps) {
  const [history, setHistory] = useState<VersionHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [assetId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await assetsApi.getHistory(assetId);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load version history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventIcon = (event: TimelineEvent) => {
    if (event.type === 'version') {
      return <Upload className="w-4 h-4 text-blue-500" />;
    }
    if (event.type === 'approval') {
      if (event.action === 'approved') {
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      }
      if (event.action === 'revision_requested') {
        return <XCircle className="w-4 h-4 text-orange-500" />;
      }
      return <Clock className="w-4 h-4 text-gray-500" />;
    }
    if (event.type === 'lock') {
      if (event.action === 'locked') {
        return <Lock className="w-4 h-4 text-red-500" />;
      }
      return <Unlock className="w-4 h-4 text-green-500" />;
    }
    return <Clock className="w-4 h-4 text-gray-500" />;
  };

  const getEventTitle = (event: TimelineEvent) => {
    if (event.type === 'version') {
      return `Version ${event.version_number} uploaded`;
    }
    if (event.type === 'approval') {
      if (event.action === 'approved') {
        return `Approved (v${event.asset_version})`;
      }
      if (event.action === 'revision_requested') {
        return `Revision requested (v${event.asset_version})`;
      }
      return `Status changed (v${event.asset_version})`;
    }
    if (event.type === 'lock') {
      return event.action === 'locked' ? 'Asset locked' : 'Asset unlocked';
    }
    return 'Event';
  };

  const getEventUser = (event: TimelineEvent): User | undefined => {
    if (event.type === 'version') {
      return event.uploaded_by;
    }
    return event.user;
  };

  const getEventDetails = (event: TimelineEvent): string | null => {
    if (event.type === 'version' && event.version_notes) {
      return event.version_notes;
    }
    if (event.type === 'approval' && event.comment) {
      return event.comment;
    }
    if (event.type === 'lock' && event.reason) {
      return event.reason;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-700 rounded w-1/3"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!history) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400" />
          <span className="font-medium text-white">Version History</span>
          <span className="text-sm text-gray-400">({history.versions.length} versions)</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          {/* Lock status indicator */}
          {history.is_locked && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-sm">
                Asset locked by {history.locked_by?.name}
                {history.locked_at && ` on ${formatDate(history.locked_at)}`}
              </span>
            </div>
          )}

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-700"></div>

            <div className="space-y-4">
              {history.timeline.map((event, index) => {
                const user = getEventUser(event);
                const details = getEventDetails(event);
                const isVersionEvent = event.type === 'version';
                const isCurrentVersion = isVersionEvent && event.version_number === currentVersion;

                return (
                  <div key={event.id} className="relative pl-10">
                    <div className="absolute left-2 w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-700">
                      {getEventIcon(event)}
                    </div>

                    <div
                      className={`p-3 rounded-lg transition-colors ${
                        isVersionEvent
                          ? `cursor-pointer hover:bg-gray-700 ${isCurrentVersion ? 'bg-blue-900/30 border border-blue-700' : 'bg-gray-700'}`
                          : 'bg-gray-700'
                      }`}
                      onClick={() => {
                        if (isVersionEvent && event.version_number && onVersionSelect) {
                          onVersionSelect(event.version_number);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`font-medium ${isCurrentVersion ? 'text-blue-300' : 'text-white'}`}>
                            {getEventTitle(event)}
                            {isCurrentVersion && (
                              <span className="ml-2 text-xs bg-blue-600 px-2 py-0.5 rounded">Current</span>
                            )}
                          </p>
                          {user && (
                            <p className="text-sm text-gray-400">
                              by {user.name}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(event.created_at)}
                        </span>
                      </div>

                      {details && (
                        <div className="mt-2 p-2 bg-gray-800 rounded text-sm text-gray-300 flex items-start gap-2">
                          <FileText className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                          <span>{details}</span>
                        </div>
                      )}

                      {isVersionEvent && event.file_size_formatted && (
                        <p className="mt-1 text-xs text-gray-500">
                          File size: {event.file_size_formatted}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
