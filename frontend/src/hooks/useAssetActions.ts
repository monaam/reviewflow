import { useMemo } from 'react';
import { Asset, Comment, User } from '../types';
import { ActionContext, ActionDefinition, ComputedAction } from '../types/actions';
import { assetActions, getLockIcon } from '../config/assetActions';

interface UseAssetActionsOptions {
  asset: Asset | null;
  user: User | null;
}

interface UseAssetActionsReturn {
  /** Actions to show in the toolbar (based on user role) */
  primaryActions: ComputedAction[];
  /** Actions to show in the dropdown menu */
  dropdownActions: ComputedAction[];
  /** Check if a specific action is available for the current user/asset */
  canPerform: (actionId: string) => boolean;
  /** Get actions available for a specific comment */
  getCommentActions: (comment: Comment) => {
    canDelete: boolean;
    canResolve: boolean;
  };
}

/**
 * Compute a single action based on context
 */
function computeAction(
  action: ActionDefinition,
  ctx: ActionContext
): ComputedAction | null {
  const userRole = ctx.user?.role;

  // Check if user's role is allowed
  if (action.roles !== 'all') {
    if (!userRole || !action.roles.includes(userRole)) {
      return null;
    }
  }

  // Check visibility conditions (if action should be shown at all)
  if (action.conditions) {
    const conditionsMet = action.conditions.every((condition) => condition(ctx));
    if (!conditionsMet) {
      return null;
    }
  }

  // Check if this is a primary action for the user's role
  const isPrimary = userRole
    ? action.primaryForRoles?.includes(userRole) ?? false
    : false;

  // Check enabled conditions (if action should be clickable)
  let isDisabled = false;
  let tooltip: string | undefined;

  if (action.enabledConditions) {
    isDisabled = !action.enabledConditions.every((condition) => condition(ctx));
    if (isDisabled && action.disabledTooltip) {
      tooltip =
        typeof action.disabledTooltip === 'function'
          ? action.disabledTooltip(ctx)
          : action.disabledTooltip;
    }
  }

  // Get the label (can be a function)
  const label =
    typeof action.label === 'function' ? action.label(ctx) : action.label;

  // Get the correct icon (special case for lock/unlock)
  const icon = action.id === 'lock' ? getLockIcon(ctx.asset.is_locked) : action.icon;

  return {
    id: action.id,
    label,
    icon,
    isPrimary,
    isDisabled,
    variant: action.variant ?? 'secondary',
    showInDropdown: action.showInDropdown ?? !isPrimary,
    tooltip,
  };
}

/**
 * Hook for computing role-based asset actions
 *
 * @example
 * const { primaryActions, dropdownActions, canPerform } = useAssetActions({
 *   asset,
 *   user,
 * });
 *
 * // Render primary actions in toolbar
 * {primaryActions.map(action => (
 *   <button key={action.id} onClick={handlers[action.id]}>
 *     <action.icon /> {action.label}
 *   </button>
 * ))}
 */
export function useAssetActions({
  asset,
  user,
}: UseAssetActionsOptions): UseAssetActionsReturn {
  const { primaryActions, dropdownActions, actionMap } = useMemo(() => {
    const primary: ComputedAction[] = [];
    const dropdown: ComputedAction[] = [];
    const map = new Map<string, ComputedAction>();

    // Return empty arrays if asset is not loaded yet
    if (!asset) {
      return { primaryActions: primary, dropdownActions: dropdown, actionMap: map };
    }

    const ctx: ActionContext = { user, asset };

    for (const actionDef of assetActions) {
      const computed = computeAction(actionDef, ctx);
      if (!computed) continue;

      map.set(computed.id, computed);

      if (computed.isPrimary) {
        primary.push(computed);
      }
      if (computed.showInDropdown) {
        dropdown.push(computed);
      }
    }

    return { primaryActions: primary, dropdownActions: dropdown, actionMap: map };
  }, [asset, user]);

  const canPerform = useMemo(
    () => (actionId: string) => {
      const action = actionMap.get(actionId);
      return action != null && !action.isDisabled;
    },
    [actionMap]
  );

  const getCommentActions = useMemo(
    () => (comment: Comment) => {
      // Admin/PM can delete any comment, or the comment author can delete their own
      const canDelete =
        user?.role === 'admin' ||
        user?.role === 'pm' ||
        comment.user_id === user?.id;

      // Anyone can resolve/unresolve comments
      const canResolve = user != null;

      return { canDelete, canResolve };
    },
    [user]
  );

  return {
    primaryActions,
    dropdownActions,
    canPerform,
    getCommentActions,
  };
}
