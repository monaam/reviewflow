import { FC, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Modal } from './Modal';
import { DocumentToolbar } from '../assetRenderers/DocumentToolbar';
import { assetsApi } from '../../api/assets';
import { Asset } from '../../types';

interface DocumentEditorModalProps {
  projectId: string;
  /** If provided, creates a new version instead of a new document */
  asset?: Asset;
  onClose: () => void;
  onSuccess: (asset: Asset) => void;
}

export const DocumentEditorModal: FC<DocumentEditorModalProps> = ({
  projectId,
  asset,
  onClose,
  onSuccess,
}) => {
  const isNewVersion = !!asset;
  const existingContent = asset?.versions?.find(
    (v) => v.version_number === asset.current_version,
  )?.content;

  const [title, setTitle] = useState(asset?.title || '');
  const [description, setDescription] = useState(asset?.description || '');
  const [versionNotes, setVersionNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({
        placeholder: 'Start writing your document...',
      }),
    ],
    content: existingContent || '',
    editable: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;

    const htmlContent = editor.getHTML();
    if (!htmlContent || htmlContent === '<p></p>') {
      setError('Content is required.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      let result: Asset;
      if (isNewVersion) {
        result = await assetsApi.submitDocumentVersion(asset!.id, {
          content: htmlContent,
          version_notes: versionNotes || undefined,
        });
      } else {
        if (!title.trim()) {
          setError('Title is required.');
          setIsLoading(false);
          return;
        }
        result = await assetsApi.createDocument(projectId, {
          title,
          description: description || undefined,
          content: htmlContent,
        });
      }
      onSuccess(result);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to save document');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title={isNewVersion ? 'New Document Version' : 'Write Document'}
      onClose={onClose}
      maxWidth="xl"
    >
      {error && (
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isNewVersion && (
          <>
            <div>
              <label htmlFor="doc-title" className="label">
                Title
              </label>
              <input
                id="doc-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="doc-description" className="label">
                Description
              </label>
              <textarea
                id="doc-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
                rows={2}
                disabled={isLoading}
              />
            </div>
          </>
        )}

        {isNewVersion && (
          <div>
            <label htmlFor="version-notes" className="label">
              Version Notes
            </label>
            <input
              id="version-notes"
              type="text"
              value={versionNotes}
              onChange={(e) => setVersionNotes(e.target.value)}
              className="input"
              placeholder="What changed in this version?"
              disabled={isLoading}
            />
          </div>
        )}

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <DocumentToolbar editor={editor} />
          <div className={`min-h-[300px] max-h-[50vh] overflow-y-auto ${isLoading ? 'pointer-events-none opacity-50' : ''}`}>
            <EditorContent
              editor={editor}
              className="prose dark:prose-invert max-w-none p-4"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
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
      </form>
    </Modal>
  );
};
