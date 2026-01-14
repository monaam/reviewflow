import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  User,
  FileText,
  Upload,
  PlayCircle,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { requestsApi } from '../api/requests';
import { assetsApi } from '../api/assets';
import { CreativeRequest, Asset } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuthStore } from '../stores/authStore';

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [request, setRequest] = useState<CreativeRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRequest();
    }
  }, [id]);

  const fetchRequest = async () => {
    try {
      const data = await requestsApi.get(id!);
      setRequest(data);
    } catch (error) {
      console.error('Failed to fetch request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      await requestsApi.start(id!);
      fetchRequest();
    } catch (error) {
      console.error('Failed to start request:', error);
    }
  };

  const handleComplete = async () => {
    try {
      await requestsApi.complete(id!);
      fetchRequest();
    } catch (error) {
      console.error('Failed to complete request:', error);
    }
  };

  const handleUploadAsset = async (file: File, title: string) => {
    try {
      const asset = await assetsApi.create(request!.project_id, {
        file,
        title,
        request_id: id,
      });
      setShowUploadModal(false);
      navigate(`/assets/${asset.id}`);
    } catch (error) {
      console.error('Failed to upload asset:', error);
    }
  };

  const isAssignee = user?.id === request?.assigned_to;
  const isCreator = user?.id === request?.created_by;
  const canComplete = (isCreator || user?.role === 'admin') && request?.status === 'asset_submitted';

  const isOverdue = request &&
    new Date(request.deadline) < new Date() &&
    !['completed', 'cancelled'].includes(request.status);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Request not found
        </h2>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/projects/${request.project_id}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Project
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {request.title}
              </h1>
              <StatusBadge status={request.priority} type="priority" />
              <StatusBadge status={request.status} type="request" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {request.project?.name}
            </p>
          </div>

          <div className="flex gap-2">
            {isAssignee && request.status === 'pending' && (
              <button onClick={handleStart} className="btn-primary">
                <PlayCircle className="w-4 h-4 mr-2" />
                Start Working
              </button>
            )}
            {isAssignee && request.status === 'in_progress' && (
              <button onClick={() => setShowUploadModal(true)} className="btn-primary">
                <Upload className="w-4 h-4 mr-2" />
                Upload Asset
              </button>
            )}
            {canComplete && (
              <button onClick={handleComplete} className="btn-success">
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Complete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Description
            </h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {request.description}
            </p>
          </div>

          {/* Specs */}
          {request.specs && Object.keys(request.specs).length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Specifications
              </h2>
              <dl className="grid grid-cols-2 gap-4">
                {Object.entries(request.specs).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-sm font-medium text-gray-500 capitalize">
                      {key.replace(/_/g, ' ')}
                    </dt>
                    <dd className="text-gray-900 dark:text-white">
                      {String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Attachments */}
          {request.attachments && request.attachments.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Reference Attachments
              </h2>
              <div className="space-y-2">
                {request.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <FileText className="w-5 h-5 text-gray-500 mr-3" />
                    <span className="text-gray-900 dark:text-white">
                      {attachment.file_name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Linked Assets */}
          {request.assets && request.assets.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Submitted Assets
              </h2>
              <div className="space-y-2">
                {request.assets.map((asset) => (
                  <Link
                    key={asset.id}
                    to={`/assets/${asset.id}`}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-500 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {asset.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          v{asset.current_version} · {asset.type}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={asset.status} type="asset" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Details
            </h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Assigned To
                </dt>
                <dd className="mt-1 text-gray-900 dark:text-white">
                  {request.assignee?.name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Created By
                </dt>
                <dd className="mt-1 text-gray-900 dark:text-white">
                  {request.creator?.name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Deadline
                </dt>
                <dd className={`mt-1 ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-900 dark:text-white'}`}>
                  {isOverdue && <AlertTriangle className="w-4 h-4 inline mr-1" />}
                  {new Date(request.deadline).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Created At
                </dt>
                <dd className="mt-1 text-gray-900 dark:text-white">
                  {new Date(request.created_at).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadAssetModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUploadAsset}
        />
      )}
    </div>
  );
}

function UploadAssetModal({
  onClose,
  onUpload,
}: {
  onClose: () => void;
  onUpload: (file: File, title: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;
    setIsLoading(true);
    await onUpload(file, title);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Upload Asset for Request
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="file" className="label">
              File
            </label>
            <input
              id="file"
              type="file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile(f);
                  if (!title) {
                    setTitle(f.name.replace(/\.[^/.]+$/, ''));
                  }
                }
              }}
              className="input"
              accept="image/*,video/*,application/pdf"
              required
            />
          </div>
          <div>
            <label htmlFor="title" className="label">
              Asset Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !file || !title}
              className="btn-primary"
            >
              {isLoading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
