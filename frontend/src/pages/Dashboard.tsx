import { useEffect, useState, useCallback } from 'react';
import { dashboardApi } from '../api/dashboard';
import { DashboardData } from '../types';
import { useAuthStore } from '../stores/authStore';
import {
  AdminDashboard,
  PMDashboard,
  CreativeDashboard,
  ReviewerDashboard,
} from '../components/dashboard';

export function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await dashboardApi.get();
      setData(response);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-300"></div>
      </div>
    );
  }

  if (!data) return null;

  const renderDashboard = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard data={data} onRefresh={fetchDashboard} />;
      case 'pm':
        return <PMDashboard data={data} onRefresh={fetchDashboard} />;
      case 'creative':
        return <CreativeDashboard data={data} onRefresh={fetchDashboard} />;
      case 'reviewer':
        return <ReviewerDashboard data={data} onRefresh={fetchDashboard} />;
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
