import { dashboardApi } from '../api/dashboard';
import { DashboardData } from '../types';
import { useAuthStore } from '../stores/authStore';
import {
  AdminDashboard,
  PMDashboard,
  CreativeDashboard,
  ReviewerDashboard,
} from '../components/dashboard';
import { LoadingSpinner } from '../components/common';
import { useFetch } from '../hooks';

export function DashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading, refetch } = useFetch({
    fetcher: () => dashboardApi.get(),
    initial: null as DashboardData | null,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" variant="gray" />
      </div>
    );
  }

  if (!data) return null;

  const renderDashboard = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard data={data} onRefresh={refetch} />;
      case 'pm':
        return <PMDashboard data={data} onRefresh={refetch} />;
      case 'creative':
        return <CreativeDashboard data={data} onRefresh={refetch} />;
      case 'reviewer':
        return <ReviewerDashboard data={data} onRefresh={refetch} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's what's happening with your projects today.
        </p>
      </div>

      {renderDashboard()}
    </div>
  );
}
