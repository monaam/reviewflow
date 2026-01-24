import { FC } from 'react';
import { MoreVertical } from 'lucide-react';
import { ComputedAction } from '../../types/actions';

interface HeaderActionsProps {
  primaryActions: ComputedAction[];
  dropdownActions: ComputedAction[];
  showActionsMenu: boolean;
  showTimeline: boolean;
  isLocking: boolean;

  onActionClick: (actionId: string) => void;
  onToggleActionsMenu: () => void;
  onCloseActionsMenu: () => void;
}

/**
 * Header action buttons (primary toolbar and dropdown menu).
 * Separates action rendering logic from the main review page.
 */
export const HeaderActions: FC<HeaderActionsProps> = ({
  primaryActions,
  dropdownActions,
  showActionsMenu,
  showTimeline,
  isLocking,
  onActionClick,
  onToggleActionsMenu,
  onCloseActionsMenu,
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* Primary actions (excluding approve/revision/upload which get special treatment) */}
      {primaryActions
        .filter((action) => !['approve', 'request-revision', 'upload-version'].includes(action.id))
        .map((action) => (
          <ActionButton
            key={action.id}
            action={action}
            onClick={() => onActionClick(action.id)}
            isActive={action.id === 'view-timeline' && showTimeline}
            isLoading={action.id === 'lock' && isLocking}
          />
        ))}

      {/* Actions dropdown */}
      {dropdownActions.length > 0 && (
        <div className="relative">
          <button
            onClick={onToggleActionsMenu}
            className="btn-secondary"
            title="More actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showActionsMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={onCloseActionsMenu} />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <div className="py-1">
                  {dropdownActions.map((action) => (
                    <DropdownActionButton
                      key={action.id}
                      action={action}
                      onClick={() => {
                        onActionClick(action.id);
                        onCloseActionsMenu();
                      }}
                      isLoading={action.id === 'lock' && isLocking}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Upload Version - shown separately for creative role prominence */}
      {primaryActions.find((a) => a.id === 'upload-version') && (
        <ActionButton
          action={primaryActions.find((a) => a.id === 'upload-version')!}
          onClick={() => onActionClick('upload-version')}
          showLabel
        />
      )}

      {/* Send to Client and Approval actions at the end for emphasis */}
      {primaryActions
        .filter((action) => ['send-to-client', 'request-revision', 'approve'].includes(action.id))
        .map((action) => (
          <ActionButton
            key={action.id}
            action={action}
            onClick={() => onActionClick(action.id)}
            showLabel
          />
        ))}
    </div>
  );
};

// Helper component for rendering toolbar action buttons
interface ActionButtonProps {
  action: ComputedAction;
  onClick: () => void;
  isActive?: boolean;
  isLoading?: boolean;
  showLabel?: boolean;
}

const ActionButton: FC<ActionButtonProps> = ({
  action,
  onClick,
  isActive = false,
  isLoading = false,
  showLabel = false,
}) => {
  const Icon = action.icon;

  const variantClasses: Record<string, string> = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    warning: 'btn-warning',
    danger: 'btn-primary bg-red-600 hover:bg-red-700',
  };

  const baseClass = variantClasses[action.variant] || 'btn-secondary';
  const activeClass = isActive ? 'bg-primary-100 dark:bg-primary-900/30' : '';

  return (
    <button
      onClick={onClick}
      disabled={action.isDisabled || isLoading}
      className={`${baseClass} ${activeClass}`}
      title={action.tooltip || action.label}
    >
      <Icon className={`w-4 h-4 ${showLabel ? 'mr-2' : ''}`} />
      {showLabel && action.label}
    </button>
  );
};

// Helper component for rendering dropdown action buttons
interface DropdownActionButtonProps {
  action: ComputedAction;
  onClick: () => void;
  isLoading?: boolean;
}

const DropdownActionButton: FC<DropdownActionButtonProps> = ({
  action,
  onClick,
  isLoading = false,
}) => {
  const Icon = action.icon;

  const textClass =
    action.variant === 'danger'
      ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700';

  return (
    <button
      onClick={onClick}
      disabled={action.isDisabled || isLoading}
      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${textClass}`}
      title={action.tooltip}
    >
      <Icon className="w-4 h-4" />
      {action.label}
    </button>
  );
};

export { ActionButton, DropdownActionButton };
