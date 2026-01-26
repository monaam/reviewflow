import { FC, useState } from 'react';
import { CommentMedia } from '../../types';
import { ImageLightbox, LightboxImage } from './ImageLightbox';

interface CommentImagesProps {
  media: CommentMedia[];
  maxVisibleThumbnails?: number;
}

export const CommentImages: FC<CommentImagesProps> = ({
  media,
  maxVisibleThumbnails = 4,
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!media || media.length === 0) {
    return null;
  }

  const visibleImages = media.slice(0, maxVisibleThumbnails);
  const remainingCount = media.length - maxVisibleThumbnails;

  const lightboxImages: LightboxImage[] = media.map((m) => ({
    src: m.original_url,
    alt: m.name,
    title: m.file_name,
  }));

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const getThumbnailUrl = (m: CommentMedia) => {
    // Prefer thumbnail, fall back to preview, then original
    return m.thumbnail_url || m.preview_url || m.original_url;
  };

  return (
    <>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {visibleImages.map((m, index) => (
          <button
            key={m.id}
            type="button"
            onClick={() => handleImageClick(index)}
            className="relative w-16 h-16 rounded border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            <img
              src={getThumbnailUrl(m)}
              alt={m.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Show +N indicator on the last visible thumbnail if there are more */}
            {index === maxVisibleThumbnails - 1 && remainingCount > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm font-medium">
                +{remainingCount}
              </div>
            )}
          </button>
        ))}
      </div>

      <ImageLightbox
        images={lightboxImages}
        open={lightboxOpen}
        index={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
      />
    </>
  );
};

export default CommentImages;
