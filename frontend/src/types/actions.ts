import { LucideIcon } from 'lucide-react';
import { Asset, Comment, User, UserRole } from './index';

/**
 * Context passed to action condition functions
 */
export interface ActionContext {
  user: User | null;
  asset: Asset;
  comment?: Comment;
}

/**
 * Function that determines if an action is available/enabled
 */
export type ActionCondition = (ctx: ActionContext) => boolean;

/**
 * Button variant for styling actions
 */
export type ActionVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

/**
 * Definition of an action with its permissions and conditions
 */
export interface ActionDefinition {
  /** Unique identifier for the action */
  id: string;
  /** Display label for the action */
  label: string | ((ctx: ActionContext) => string);
  /** Lucide icon component */
  icon: LucideIcon;
  /** Roles that can see/use this action */
  roles: UserRole[] | 'all';
  /** Roles for which this action is primary (shown in toolbar) */
  primaryForRoles?: UserRole[];
  /** Conditions that must be true for the action to be available */
  conditions?: ActionCondition[];
  /** Conditions that must be true for the action to be enabled (not disabled) */
  enabledConditions?: ActionCondition[];
  /** Button variant for styling */
  variant?: ActionVariant;
  /** Whether to show in dropdown menu (default: true for non-primary actions) */
  showInDropdown?: boolean;
  /** Tooltip text when action is disabled */
  disabledTooltip?: string | ((ctx: ActionContext) => string);
}

/**
 * Computed action ready for rendering
 */
export interface ComputedAction {
  /** Unique identifier for the action */
  id: string;
  /** Display label for the action */
  label: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Whether this is a primary action (shown in toolbar) */
  isPrimary: boolean;
  /** Whether the action is currently disabled */
  isDisabled: boolean;
  /** Button variant for styling */
  variant: ActionVariant;
  /** Whether to show in dropdown menu */
  showInDropdown: boolean;
  /** Tooltip text (especially when disabled) */
  tooltip?: string;
}

/**
 * Action handlers map type
 */
export type ActionHandlers = Record<string, () => void>;
