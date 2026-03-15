import { FC, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Extension } from '@tiptap/react';
import { Comment, TextAnchor } from '../../types';

interface DocumentRendererProps {
  content: string;
  comments: Comment[];
  selectedCommentId: string | null;
  pendingSelection?: TextAnchor | null;
  onTextSelection?: (anchor: TextAnchor | null) => void;
  onAnnotationClick?: (commentId: string) => void;
}

/**
 * Creates the highlight extension once. It reads dynamic values from refs
 * so the editor doesn't need to be recreated when comments/selection change.
 */
function createAnnotationHighlightExtension(
  commentsRef: React.RefObject<Comment[]>,
  selectedCommentIdRef: React.RefObject<string | null>,
  pendingSelectionRef: React.RefObject<TextAnchor | null>,
  onAnnotationClickRef: React.RefObject<((commentId: string) => void) | undefined>,
) {
  const pluginKey = new PluginKey('annotationHighlight');

  return Extension.create({
    name: 'annotationHighlight',

    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: pluginKey,
          props: {
            decorations(state) {
              const decorations: Decoration[] = [];
              const docSize = state.doc.content.size;
              const comments = commentsRef.current;
              const selectedCommentId = selectedCommentIdRef.current;
              const pendingSelection = pendingSelectionRef.current;

              // Pending user selection highlight
              if (pendingSelection) {
                const { from, to } = pendingSelection;
                if (from >= 0 && to <= docSize && from < to) {
                  decorations.push(
                    Decoration.inline(from, to, {
                      class: 'annotation-pending',
                    }),
                  );
                }
              }

              for (const comment of comments) {
                if (!comment.text_anchor) continue;
                const { from, to } = comment.text_anchor;
                if (from < 0 || to > docSize || from >= to) continue;

                const isSelected = comment.id === selectedCommentId;
                const isResolved = comment.is_resolved;

                let className = 'annotation-unresolved';
                if (isSelected) {
                  className = 'annotation-selected';
                } else if (isResolved) {
                  className = 'annotation-resolved';
                }

                decorations.push(
                  Decoration.inline(from, to, {
                    class: className,
                    'data-comment-id': comment.id,
                  }),
                );
              }

              return DecorationSet.create(state.doc, decorations);
            },
            handleClick(_view, _pos, event) {
              const target = event.target as HTMLElement;
              const annotationEl = target.closest('[data-comment-id]');
              if (annotationEl && onAnnotationClickRef.current) {
                const commentId = annotationEl.getAttribute('data-comment-id');
                if (commentId) {
                  onAnnotationClickRef.current(commentId);
                  return true;
                }
              }
              return false;
            },
          },
        }),
      ];
    },
  });
}

export const DocumentRenderer: FC<DocumentRendererProps> = ({
  content,
  comments,
  selectedCommentId,
  pendingSelection,
  onTextSelection,
  onAnnotationClick,
}) => {
  // Store dynamic values in refs so the plugin reads fresh data
  // without triggering editor recreation
  const commentsRef = useRef(comments);
  const selectedCommentIdRef = useRef(selectedCommentId);
  const pendingSelectionRef = useRef(pendingSelection ?? null);
  const onAnnotationClickRef = useRef(onAnnotationClick);

  commentsRef.current = comments;
  selectedCommentIdRef.current = selectedCommentId;
  pendingSelectionRef.current = pendingSelection ?? null;
  onAnnotationClickRef.current = onAnnotationClick;

  // Create extension once — it reads from refs, never needs recreation
  const highlightExtension = useRef(
    createAnnotationHighlightExtension(commentsRef, selectedCommentIdRef, pendingSelectionRef, onAnnotationClickRef),
  ).current;

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Underline,
        Link.configure({ openOnClick: true }),
        Table.configure({ resizable: false }),
        TableRow,
        TableHeader,
        TableCell,
        highlightExtension,
      ],
      content,
      editable: false,
    },
    [content],
  );

  // When dynamic props change, dispatch a no-op transaction to
  // force ProseMirror to recompute decorations
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.view.dispatch(editor.state.tr);
    }
  }, [editor, comments, selectedCommentId, pendingSelection]);

  // Capture text selection
  useEffect(() => {
    if (!editor || !onTextSelection) return;

    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        onTextSelection(null);
        return;
      }
      const selectedText = editor.state.doc.textBetween(from, to, ' ');
      onTextSelection({ from, to, selectedText });
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor, onTextSelection]);

  return (
    <div className="document-renderer w-full h-full overflow-y-auto bg-white dark:bg-gray-900 flex justify-center">
      <div className="max-w-3xl w-full px-8 py-12">
        <EditorContent
          editor={editor}
          className="prose dark:prose-invert max-w-none cursor-text"
        />
      </div>
    </div>
  );
};
