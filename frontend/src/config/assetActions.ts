import {
  Check,
  RotateCcw,
  Upload,
  Lock,
  Unlock,
  Download,
  Edit2,
  Trash2,
  Layers,
  Clock,
  Send,
} from 'lucide-react';
import { ActionDefinition, ActionContext } from '../types/actions';

// Reusable condition functions
const conditions = {
  /** Check if user is owner of the asset */
  isOwner: (ctx: ActionContext): boolean => {
    return ctx.user?.id === ctx.asset.uploaded_by;
  },

  /** Check if asset is not locked */
  notLocked: (ctx: ActionContext): boolean => {
    return !ctx.asset.is_locked;
  },

  /** Check if asset is locked */
  isLocked: (ctx: ActionContext): boolean => {
    return ctx.asset.is_locked;
  },

  /** Check if asset is not approved */
  notApproved: (ctx: ActionContext): boolean => {
    return ctx.asset.status !== 'approved';
  },

  /** Check if asset is in review (ready to send to client) */
  isInReview: (ctx: ActionContext): boolean => {
    return ctx.asset.status === 'in_review';
  },

  /** Check if asset can be approved (in_review or client_review) */
  canBeApproved: (ctx: ActionContext): boolean => {
    return ['in_review', 'client_review'].includes(ctx.asset.status);
  },

  /** Check if asset has multiple versions */
  hasMultipleVersions: (ctx: ActionContext): boolean => {
    return (ctx.asset.versions?.length ?? 0) > 1;
  },

  /** Check if user is admin or PM */
  isAdminOrPm: (ctx: ActionContext): boolean => {
    return ctx.user?.role === 'admin' || ctx.user?.role === 'pm';
  },

  /** Check if user is admin, PM, or creative owner */
  canManageAsset: (ctx: ActionContext): boolean => {
    const role = ctx.user?.role;
    if (role === 'admin' || role === 'pm') return true;
    if (role === 'creative' && ctx.user?.id === ctx.asset.uploaded_by) return true;
    return false;
  },
};

/**
 * All asset actions with their role permissions and conditions
 */
export const assetActions: ActionDefinition[] = [
  // Send to Client - for PM/Admin to send assets to client review
  {
    id: 'send-to-client',
    label: 'Send to Client',
    icon: Send,
    roles: ['admin', 'pm'],
    primaryForRoles: ['admin', 'pm'],
    conditions: [conditions.isInReview],
    variant: 'primary',
    showInDropdown: false,
  },
  // Primary actions for admin/pm/reviewer
  {
    id: 'approve',
    label: 'Approve',
    icon: Check,
    roles: ['admin', 'pm', 'reviewer'],
    primaryForRoles: ['admin', 'pm', 'reviewer'],
    conditions: [conditions.canBeApproved],
    variant: 'success',
    showInDropdown: false,
  },
  {
    id: 'request-revision',
    label: 'Revision',
    icon: RotateCcw,
    roles: ['admin', 'pm', 'reviewer'],
    primaryForRoles: ['admin', 'pm', 'reviewer'],
    conditions: [conditions.canBeApproved],
    variant: 'warning',
    showInDropdown: false,
  },

  // Upload version - primary for creative
  {
    id: 'upload-version',
    label: 'New Version',
    icon: Upload,
    roles: ['admin', 'pm', 'creative'],
    primaryForRoles: ['creative'],
    conditions: [conditions.canManageAsset],
    enabledConditions: [conditions.notLocked],
    variant: 'secondary',
    showInDropdown: false,
    disabledTooltip: 'Asset is locked. Unlock to upload a new version.',
  },

  // Compare versions - in dropdown for admin/pm/creative, hidden for reviewers (they only see current version)
  {
    id: 'compare-versions',
    label: 'Compare',
    icon: Layers,
    roles: ['admin', 'pm', 'creative'],
    conditions: [conditions.hasMultipleVersions],
    variant: 'secondary',
    showInDropdown: true,
  },

  // View timeline - primary for creative, in dropdown for admin/pm, hidden for reviewers
  {
    id: 'view-timeline',
    label: 'Timeline',
    icon: Clock,
    roles: ['admin', 'pm', 'creative'],
    primaryForRoles: ['creative'],
    variant: 'secondary',
    // showInDropdown defaults to !isPrimary, so it will be in dropdown for admin/pm
  },

  // Dropdown actions
  {
    id: 'lock',
    label: (ctx) => (ctx.asset.is_locked ? 'Unlock' : 'Lock'),
    icon: Lock,
    roles: ['admin', 'pm'],
    variant: 'secondary',
    showInDropdown: true,
  },

  {
    id: 'download',
    label: 'Download',
    icon: Download,
    roles: 'all',
    variant: 'secondary',
    showInDropdown: true,
  },

  {
    id: 'download-all',
    label: 'Download All Versions',
    icon: Download,
    roles: 'all',
    conditions: [conditions.hasMultipleVersions],
    variant: 'secondary',
    showInDropdown: true,
  },

  {
    id: 'edit',
    label: 'Edit',
    icon: Edit2,
    roles: ['admin', 'pm', 'creative'],
    conditions: [conditions.canManageAsset],
    variant: 'secondary',
    showInDropdown: true,
  },

  {
    id: 'delete',
    label: 'Delete',
    icon: Trash2,
    roles: ['admin', 'pm'],
    conditions: [conditions.isAdminOrPm],
    variant: 'danger',
    showInDropdown: true,
  },
];

/**
 * Get the icon for lock/unlock based on asset state
 */
export function getLockIcon(isLocked: boolean) {
  return isLocked ? Unlock : Lock;
}

export { conditions };
