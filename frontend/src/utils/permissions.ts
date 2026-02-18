/**
 * User role type definition
 * Matches backend UserRole enum
 */
export type UserRole = 'admin' | 'pm' | 'creative' | 'reviewer';

/**
 * Check if user has a managerial role (admin or PM)
 * These roles can create projects, manage members, edit projects, etc.
 */
export function isManagerial(role: UserRole | undefined | null): boolean {
  if (!role) return false;
  return role === 'admin' || role === 'pm';
}

/**
 * Check if user is an admin
 */
export function isAdmin(role: UserRole | undefined | null): boolean {
  return role === 'admin';
}

/**
 * Check if user is a project manager
 */
export function isPM(role: UserRole | undefined | null): boolean {
  return role === 'pm';
}

/**
 * Check if user is a creative
 */
export function isCreative(role: UserRole | undefined | null): boolean {
  return role === 'creative';
}

/**
 * Check if user is a reviewer
 */
export function isReviewer(role: UserRole | undefined | null): boolean {
  return role === 'reviewer';
}

/**
 * Check if user can upload assets (admin, PM, or creative)
 */
export function canUpload(role: UserRole | undefined | null): boolean {
  if (!role) return false;
  return role === 'admin' || role === 'pm' || role === 'creative';
}

/**
 * Check if user can create projects (admin or PM)
 */
export function canCreateProject(role: UserRole | undefined | null): boolean {
  return isManagerial(role);
}

/**
 * Check if user can edit projects (admin or PM)
 */
export function canEditProject(role: UserRole | undefined | null): boolean {
  return isManagerial(role);
}

/**
 * Check if user can manage project members (admin or PM)
 */
export function canManageMembers(role: UserRole | undefined | null): boolean {
  return isManagerial(role);
}

/**
 * Check if user can create creative requests (admin or PM)
 */
export function canCreateRequest(role: UserRole | undefined | null): boolean {
  return isManagerial(role);
}

/**
 * Check if user can delete comments (admin or PM)
 * Note: Users can also delete their own comments - check separately
 */
export function canDeleteAnyComment(role: UserRole | undefined | null): boolean {
  return isManagerial(role);
}

/**
 * Check if user can approve/reject assets (admin, PM, or reviewer)
 */
export function canApprove(role: UserRole | undefined | null): boolean {
  if (!role) return false;
  return role === 'admin' || role === 'pm' || role === 'reviewer';
}
