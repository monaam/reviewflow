import { FC, useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImagePlus, X, Loader2, AlertCircle } from 'lucide-react';
import { TempCommentImage } from '../../types';
import { commentImagesApi } from '../../api/assets';
import { useImagePaste } from '../../hooks';

interface CommentImageUploadProps {
  images: TempCommentImage[];
  onChange: (images: TempCommentImage[]) => void;
  maxImages?: number;
  maxSizeBytes?: number;
  disabled?: boolean;
  compact?: boolean;
  /** Ref to the parent form container - paste only works when focus is within this container */
  formContainerRef?: React.RefObject<HTMLElement | null>;
}

const MAX_SIZE_DEFAULT = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
};

export const CommentImageUpload: FC<CommentImageUploadProps> = ({
  images,
  onChange,
  maxImages = 10,
  maxSizeBytes = MAX_SIZE_DEFAULT,
  disabled = false,
  compact = false,
  formContainerRef,
}) => {
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const localContainerRef = useRef<HTMLDivElement>(null);

  // Use the provided form container ref, or fall back to local container
  const containerRef = formContainerRef || localContainerRef;

  const handleUpload = useCallback(
    async (files: File[]) => {
      if (disabled) return;

      const availableSlots = maxImages - images.length;
      if (availableSlots <= 0) {
        setUploadErrors([`Maximum ${maxImages} images allowed`]);
        return;
      }

      const filesToUpload = files.slice(0, availableSlots);
      const errors: string[] = [];

      // Create pending images with uploading state
      const pendingImages: TempCommentImage[] = filesToUpload.map((file) => ({
        temp_id: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        filename: file.name,
        preview_url: URL.createObjectURL(file),
        size: file.size,
        uploading: true,
        progress: 0,
      }));

      onChange([...images, ...pendingImages]);

      // Upload each file
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const pendingImage = pendingImages[i];

        if (file.size > maxSizeBytes) {
          errors.push(`${file.name}: File too large (max ${maxSizeBytes / 1024 / 1024}MB)`);
          // Remove the pending image
          onChange((prev) => prev.filter((img) => img.temp_id !== pendingImage.temp_id));
          continue;
        }

        try {
          const response = await commentImagesApi.uploadTemp(file, (progress) => {
            onChange((prev) =>
              prev.map((img) =>
                img.temp_id === pendingImage.temp_id ? { ...img, progress } : img
              )
            );
          });

          // Replace pending with actual uploaded image
          onChange((prev) =>
            prev.map((img) =>
              img.temp_id === pendingImage.temp_id
                ? {
                    temp_id: response.temp_id,
                    filename: response.filename,
                    preview_url: response.preview_url,
                    size: response.size,
                    uploading: false,
                    progress: 100,
                  }
                : img
            )
          );
        } catch {
          errors.push(`${file.name}: Upload failed`);
          // Remove the pending image
          onChange((prev) => prev.filter((img) => img.temp_id !== pendingImage.temp_id));
        }
      }

      if (errors.length > 0) {
        setUploadErrors(errors);
        setTimeout(() => setUploadErrors([]), 5000);
      }
    },
    [disabled, images, maxImages, maxSizeBytes, onChange]
  );

  const handleRemove = useCallback(
    async (tempId: string) => {
      const image = images.find((img) => img.temp_id === tempId);
      if (!image) return;

      // Remove from UI immediately
      onChange(images.filter((img) => img.temp_id !== tempId));

      // Revoke object URL if it's a blob
      if (image.preview_url.startsWith('blob:')) {
        URL.revokeObjectURL(image.preview_url);
      }

      // Delete from server if it's not a pending upload
      if (!tempId.startsWith('pending-') && !image.uploading) {
        try {
          await commentImagesApi.deleteTemp(tempId);
        } catch {
          // Ignore errors on delete - image is already removed from UI
        }
      }
    },
    [images, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_TYPES,
    maxSize: maxSizeBytes,
    disabled: disabled || images.length >= maxImages,
    onDrop: handleUpload,
    noClick: false,
    noKeyboard: false,
  });

  // Handle clipboard paste - only when focus is within the form container
  useImagePaste({
    onPaste: handleUpload,
    maxFiles: maxImages - images.length,
    maxSizeBytes,
    enabled: !disabled && images.length < maxImages,
    containerRef,
  });

  const canUploadMore = !disabled && images.length < maxImages;

  if (compact && images.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...getRootProps()}
          disabled={!canUploadMore}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <input {...getInputProps()} />
          <ImagePlus className="w-4 h-4" />
          <span>Add image</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Upload errors */}
      {uploadErrors.length > 0 && (
        <div className="flex items-start gap-2 p-2 text-xs text-red-600 bg-red-50 rounded">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            {uploadErrors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        </div>
      )}

      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((image) => (
            <div
              key={image.temp_id}
              className="relative group w-16 h-16 rounded border border-gray-200 overflow-hidden bg-gray-100"
            >
              <img
                src={image.preview_url}
                alt={image.filename}
                className={`w-full h-full object-cover ${image.uploading ? 'opacity-50' : ''}`}
              />
              {image.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
              {!image.uploading && !disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(image.temp_id)}
                  className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              {image.uploading && typeof image.progress === 'number' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${image.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone / upload button */}
      {canUploadMore && (
        <div
          {...getRootProps()}
          className={`
            flex items-center justify-center gap-2 p-3
            border-2 border-dashed rounded cursor-pointer
            transition-colors text-sm
            ${isDragActive
              ? 'border-blue-400 bg-blue-50 text-blue-600'
              : 'border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-700'
            }
          `}
        >
          <input {...getInputProps()} />
          <ImagePlus className="w-4 h-4" />
          <span>
            {isDragActive
              ? 'Drop images here'
              : images.length > 0
              ? 'Add more images'
              : 'Drop images or click to upload (paste also works)'}
          </span>
        </div>
      )}

      {/* Image count */}
      {images.length > 0 && (
        <div className="text-xs text-gray-400">
          {images.length} / {maxImages} images
        </div>
      )}
    </div>
  );
};

export default CommentImageUpload;
