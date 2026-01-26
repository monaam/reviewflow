import { useCallback, useEffect, RefObject } from 'react';

export interface UseImagePasteOptions {
  onPaste: (files: File[]) => void;
  maxFiles?: number;
  maxSizeBytes?: number;
  acceptedMimeTypes?: string[];
  enabled?: boolean;
  /** Container ref - paste only handled when focus is within this container */
  containerRef?: RefObject<HTMLElement | null>;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function useImagePaste({
  onPaste,
  maxFiles = 10,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  acceptedMimeTypes = DEFAULT_ACCEPTED_TYPES,
  enabled = true,
  containerRef,
}: UseImagePasteOptions) {
  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      if (!enabled) return;

      // If containerRef is provided, only handle paste when focus is within the container
      if (containerRef?.current) {
        const activeElement = document.activeElement;
        if (!activeElement || !containerRef.current.contains(activeElement)) {
          return;
        }
      }

      const items = event.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];

      for (let i = 0; i < items.length && imageFiles.length < maxFiles; i++) {
        const item = items[i];

        // Check if item is an image
        if (item.kind === 'file' && acceptedMimeTypes.includes(item.type)) {
          const file = item.getAsFile();
          if (file) {
            // Check file size
            if (file.size <= maxSizeBytes) {
              imageFiles.push(file);
            } else {
              console.warn(
                `Image "${file.name}" exceeds max size of ${maxSizeBytes / 1024 / 1024}MB`
              );
            }
          }
        }
      }

      if (imageFiles.length > 0) {
        // Prevent the default paste behavior only if we have images
        event.preventDefault();
        onPaste(imageFiles);
      }
    },
    [enabled, maxFiles, maxSizeBytes, acceptedMimeTypes, onPaste, containerRef]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [enabled, handlePaste]);

  return {
    handlePaste,
  };
}

export default useImagePaste;
