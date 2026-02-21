const STUDIO_PREFIX = '/studio';

export const routes = {
  // Public routes
  home: () => '/',
  login: () => '/login',
  signup: () => '/signup',
  forgotPassword: () => '/forgot-password',
  resetPassword: (token: string) => `/reset-password/${token}`,
  verifyEmail: (token: string) => `/verify-email/${token}`,
  invite: (token: string) => `/invite/${token}`,

  // Studio routes (authenticated)
  studio: {
    dashboard: () => `${STUDIO_PREFIX}`,
    projects: () => `${STUDIO_PREFIX}/projects`,
    project: (id: string | number) => `${STUDIO_PREFIX}/projects/${id}`,
    projectDocumentNew: (id: string | number) => `${STUDIO_PREFIX}/projects/${id}/documents/new`,
    assets: () => `${STUDIO_PREFIX}/assets`,
    asset: (id: string | number) => `${STUDIO_PREFIX}/assets/${id}`,
    assetDocumentNewVersion: (id: string | number) => `${STUDIO_PREFIX}/assets/${id}/documents/new-version`,
    requests: () => `${STUDIO_PREFIX}/requests`,
    request: (id: string | number) => `${STUDIO_PREFIX}/requests/${id}`,
    queue: () => `${STUDIO_PREFIX}/queue`,
    reviewQueue: () => `${STUDIO_PREFIX}/review-queue`,
    notifications: () => `${STUDIO_PREFIX}/notifications`,
    profile: () => `${STUDIO_PREFIX}/profile`,
    adminUsers: () => `${STUDIO_PREFIX}/admin/users`,
    adminSettings: () => `${STUDIO_PREFIX}/admin/settings`,
  },
} as const;
