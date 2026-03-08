import { useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { isRootPath } from '../utils/routes';

export type NavigationDirection = 'forward' | 'back' | 'none';

export function useNavigationDirection(): NavigationDirection {
  const location = useLocation();
  const navigationType = useNavigationType();
  const prevPathRef = useRef(location.pathname);

  const currentPath = location.pathname;
  const prevPath = prevPathRef.current;

  // Update ref for next render
  if (prevPath !== currentPath) {
    prevPathRef.current = currentPath;
  }

  // Tab-to-tab: no transition
  if (isRootPath(currentPath) && isRootPath(prevPath)) {
    return 'none';
  }

  // Browser back / forward-back
  if (navigationType === 'POP') {
    return 'back';
  }

  // Explicit push (link click, navigate())
  if (navigationType === 'PUSH') {
    return 'forward';
  }

  // REPLACE — no transition
  return 'none';
}
