import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { DocumentToolbar } from '../components/assetRenderers/DocumentToolbar';
import { assetsApi } from '../api/assets';
import { Asset } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

/**
 * Full-page document editor for creating new documents or new versions.
 *
 * Routes:
 *   /projects/:id/documents/new         → create mode
 *   /assets/:id/documents/new-version   → new version mode
 */
export function DocumentEditorPage() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const id = params.id!;

  // Determine mode from the current path
  const isNewVersion = pathname.includes('/documents/new-version');

  const [asset, setAsset] = useState<Asset | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [versionNotes, setVersionNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isNewVersion);
  const [error, setError] = useState('');

  // Store fetched content so it can be set once editor is ready
  const pendingContentRef = useRef<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({
        placeholder: 'Start writing your document...',
      }),
    ],
    content: '',
    editable: true,
  });

  // Fetch asset data when editing a new version
  useEffect(() => {
    if (!isNewVersion) return;

    assetsApi
      .get(id)
      .then((data) => {
        setAsset(data);
        const currentContent = data.versions?.find(
          (v) => v.version_number === data.current_version,
        )?.content;
        if (currentContent) {
          if (editor && !editor.isDestroyed) {
            editor.commands.setContent(currentContent);
          } else {
            pendingContentRef.current = currentContent;
          }
        }
      })
      .catch(() => setError('Failed to load asset'))
      .finally(() => setIsFetching(false));
  }, [id, isNewVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set pending content once editor becomes available
  useEffect(() => {
    if (editor && !editor.isDestroyed && pendingContentRef.current) {
      editor.commands.setContent(pendingContentRef.current);
      pendingContentRef.current = null;
    }
  }, [editor]);

  const handleSubmit = async () => {
    if (!editor) return;

    if (editor.isEmpty) {
      setError('Content is required.');
      return;
    }

    const htmlContent = editor.getHTML();

    setError('');
    setIsLoading(true);

    try {
      let result: Asset;
      if (isNewVersion && asset) {
        result = await assetsApi.submitDocumentVersion(asset.id, {
          content: htmlContent,
          version_notes: versionNotes || undefined,
        });
        navigate(`/assets/${result.id}`);
      } else {
        if (!title.trim()) {
          setError('Title is required.');
          setIsLoading(false);
          return;
        }
        result = await assetsApi.createDocument(id, {
          title,
          description: description || undefined,
          content: htmlContent,
        });
        navigate(`/assets/${result.id}`);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to save document');
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (isNewVersion && asset) {
      navigate(`/assets/${asset.id}`);
    } else {
      navigate(`/projects/${id}`);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="md" variant="gray" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isNewVersion ? 'New Document Version' : 'Write Document'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
          )}
          <button
            onClick={handleCancel}
            className="btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading
              ? 'Saving...'
              : isNewVersion
              ? 'Submit Version'
              : 'Create Document'}
          </button>
        </div>
      </div>

      {/* Meta fields */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {!isNewVersion ? (
          <div className="max-w-3xl mx-auto space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-semibold bg-transparent border-none outline-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
              placeholder="Document title..."
              required
              disabled={isLoading}
              id="doc-title"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm bg-transparent border-none outline-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-500 dark:text-gray-400"
              placeholder="Add a description (optional)"
              disabled={isLoading}
            />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <input
              type="text"
              value={versionNotes}
              onChange={(e) => setVersionNotes(e.target.value)}
              className="w-full text-sm bg-transparent border-none outline-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-500 dark:text-gray-400"
              placeholder="Version notes — what changed? (optional)"
              disabled={isLoading}
              id="version-notes"
            />
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-3xl mx-auto">
          <DocumentToolbar editor={editor} />
        </div>
      </div>

      {/* Editor */}
      <div className={`flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 ${isLoading ? 'pointer-events-none opacity-50' : ''}`}>
        <div className="max-w-3xl mx-auto py-8 px-6">
          <EditorContent
            editor={editor}
            className="prose dark:prose-invert max-w-none min-h-[60vh]"
          />
        </div>
      </div>
    </div>
  );
}
