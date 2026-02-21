import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/Login';
import { SignupPage } from './pages/Signup';
import { LandingPage } from './pages/Landing';
import { DashboardPage } from './pages/Dashboard';
import { ProjectsPage } from './pages/Projects';
import { ProjectDetailPage } from './pages/ProjectDetail';
import { AssetsPage } from './pages/Assets';
import { AssetReviewPage } from './pages/AssetReview';
import { RequestsPage } from './pages/Requests';
import { CreativeQueuePage } from './pages/CreativeQueue';
import { ReviewQueuePage } from './pages/ReviewQueue';
import { RequestDetailPage } from './pages/RequestDetail';
import { DocumentEditorPage } from './pages/DocumentEditor';
import { NotificationsPage } from './pages/Notifications';
import { AdminUsersPage } from './pages/AdminUsers';
import { AdminSettingsPage } from './pages/AdminSettings';
import { ProfileSettingsPage } from './pages/ProfileSettings';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import { routes } from './utils/routes';
import './index.css';

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={routes.studio.dashboard()} replace />;
  }

  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={routes.login()} replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  if (user?.role !== 'admin') {
    return <Navigate to={routes.studio.dashboard()} replace />;
  }

  return <>{children}</>;
}

function App() {
  const { checkAuth, isLoading } = useAuthStore();
  const { initializeTheme } = useThemeStore();

  useEffect(() => {
    initializeTheme();
    checkAuth();
  }, [initializeTheme, checkAuth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route
          path="/studio"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="projects/:id/documents/new" element={<DocumentEditorPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="assets/:id" element={<AssetReviewPage />} />
          <Route path="assets/:id/documents/new-version" element={<DocumentEditorPage />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="requests/:id" element={<RequestDetailPage />} />
          <Route path="queue" element={<CreativeQueuePage />} />
          <Route path="review-queue" element={<ReviewQueuePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfileSettingsPage />} />

          {/* Admin Routes */}
          <Route
            path="admin/users"
            element={
              <AdminRoute>
                <AdminUsersPage />
              </AdminRoute>
            }
          />
          <Route
            path="admin/settings"
            element={
              <AdminRoute>
                <AdminSettingsPage />
              </AdminRoute>
            }
          />
        </Route>

        {/* Legacy redirects: old routes → /studio/ */}
        <Route path="/projects/*" element={<Navigate to={routes.studio.projects()} replace />} />
        <Route path="/assets/*" element={<Navigate to={routes.studio.assets()} replace />} />
        <Route path="/requests/*" element={<Navigate to={routes.studio.requests()} replace />} />
        <Route path="/queue" element={<Navigate to={routes.studio.queue()} replace />} />
        <Route path="/review-queue" element={<Navigate to={routes.studio.reviewQueue()} replace />} />
        <Route path="/notifications" element={<Navigate to={routes.studio.notifications()} replace />} />
        <Route path="/profile" element={<Navigate to={routes.studio.profile()} replace />} />
        <Route path="/admin/*" element={<Navigate to={routes.studio.adminUsers()} replace />} />

        <Route path="*" element={<Navigate to={routes.home()} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
