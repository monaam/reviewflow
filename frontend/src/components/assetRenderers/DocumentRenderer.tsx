import { FC, useEffect, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Extension } from '@tiptap/react';
import { Comment, TextAnchor } from '../../types';

interface DocumentRendererProps {
  content: string;
  comments: Comment[];
  selectedCommentId: string | null;
  onTextSelection?: (anchor: TextAnchor | null) => void;
  onAnnotationClick?: (commentId: string) => void;
}

function createAnnotationHighlightExtension(
  comments: Comment[],
  selectedCommentId: string | null,
  onAnnotationClick?: (commentId: string) => void,
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
              if (annotationEl && onAnnotationClick) {
                const commentId = annotationEl.getAttribute('data-comment-id');
                if (commentId) {
                  onAnnotationClick(commentId);
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
  onTextSelection,
  onAnnotationClick,
}) => {
  const highlightExtension = useMemo(
    () => createAnnotationHighlightExtension(comments, selectedCommentId, onAnnotationClick),
    [comments, selectedCommentId, onAnnotationClick],
  );

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Underline,
        Link.configure({ openOnClick: true }),
        highlightExtension,
      ],
      content,
      editable: false,
    },
    [content, highlightExtension],
  );

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
        <style>{`
          .annotation-unresolved {
            background-color: rgba(250, 204, 21, 0.3);
            cursor: pointer;
            border-radius: 2px;
          }
          .annotation-resolved {
            background-color: rgba(34, 197, 94, 0.2);
            cursor: pointer;
            border-radius: 2px;
          }
          .annotation-selected {
            background-color: rgba(59, 130, 246, 0.3);
            cursor: pointer;
            border-radius: 2px;
          }
        `}</style>
        <EditorContent
          editor={editor}
          className="prose dark:prose-invert max-w-none cursor-text"
        />
      </div>
    </div>
  );
};
