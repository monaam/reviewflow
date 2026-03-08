import { useRef } from 'react';
import { useOutlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useNavigationDirection, NavigationDirection } from '../../hooks/useNavigationDirection';

/** Preserves the outlet element captured at mount time so it doesn't change during exit animation. */
function FrozenOutlet({ outlet }: { outlet: React.ReactElement | null }) {
  const frozen = useRef(outlet);
  return frozen.current;
}

const variants = {
  enter: (dir: NavigationDirection) => ({
    x: dir === 'forward' ? '100%' : dir === 'back' ? '-30%' : 0,
    opacity: dir === 'none' ? 0 : 1,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: NavigationDirection) => ({
    x: dir === 'forward' ? '-30%' : dir === 'back' ? '100%' : 0,
    opacity: dir === 'none' ? 0 : 1,
  }),
};

const transition = {
  duration: 0.25,
  ease: [0.32, 0.72, 0, 1] as const,
};

export function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  const isMobile = useIsMobile();
  const direction = useNavigationDirection();

  // Desktop: no animation
  if (!isMobile) return outlet;

  // Respect reduced motion preference
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) return outlet;

  return (
    <AnimatePresence mode="popLayout" custom={direction} initial={false}>
      <motion.div
        key={location.pathname}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={transition}
        className="absolute inset-0 overflow-auto bg-white dark:bg-gray-900"
      >
        <FrozenOutlet outlet={outlet as React.ReactElement | null} />
      </motion.div>
    </AnimatePresence>
  );
}
