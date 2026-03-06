import { FC, ReactNode } from 'react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { BottomSheet } from '../common/BottomSheet';

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export const Modal: FC<ModalProps> = ({
  title,
  children,
  onClose,
  maxWidth = 'md',
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <BottomSheet isOpen onClose={onClose} title={title}>
        {children}
      </BottomSheet>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 ${maxWidthClasses[maxWidth]} w-full mx-4 p-6 max-h-[90vh] overflow-y-auto`}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
};
