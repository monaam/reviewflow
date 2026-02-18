// Dashboard-specific EmptyState wrapper that defaults to circular variant
import { EmptyState as CommonEmptyState, EmptyStateProps } from '../common/EmptyState';

export function EmptyState({ variant = 'circular', ...props }: EmptyStateProps) {
  return <CommonEmptyState variant={variant} {...props} />;
}
