import { FC } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';

export interface LightboxImage {
  src: string;
  alt?: string;
  title?: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  open: boolean;
  index: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

export const ImageLightbox: FC<ImageLightboxProps> = ({
  images,
  open,
  index,
  onClose,
  onIndexChange,
}) => {
  const slides = images.map((image) => ({
    src: image.src,
    alt: image.alt || '',
    title: image.title,
  }));

  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={slides}
      on={{
        view: ({ index: newIndex }) => {
          onIndexChange?.(newIndex);
        },
      }}
      plugins={[Zoom, Counter]}
      zoom={{
        maxZoomPixelRatio: 3,
        scrollToZoom: true,
      }}
      counter={{
        container: { style: { top: 0, bottom: 'unset' } },
      }}
      carousel={{
        finite: images.length <= 1,
      }}
      controller={{
        closeOnBackdropClick: true,
      }}
      styles={{
        container: { backgroundColor: 'rgba(0, 0, 0, 0.9)' },
      }}
    />
  );
};

export default ImageLightbox;
