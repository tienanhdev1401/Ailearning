import { useEffect, useMemo, useState } from 'react';
import dashboardService from '../services/dashboardService';

const emptyData = {
  statsCards: [],
  revenueDataset: { labels: [], revenue: [], profit: [] },
  userGrowthDataset: { labels: [], data: [] },
  orderStatusDataset: { labels: [], data: [] },
  recentOrders: [],
  activityFeed: [],
  storageUsage: { used: 0, total: 0 },
  salesByLocation: [],
  contentStats: { lessons: 0, roadmaps: 0, minigames: 0, activities: 0 },
  subscriptionDistribution: { labels: [], data: [] },
  monthlyRevenue: [],
  usageDataset: { labels: [], aiConversations: [], resolvedTickets: [] },
  recentTickets: []
};

export const useDashboardData = () => {
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const result = await dashboardService.getOverview();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err?.message || 'Không thể tải dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 60000);
    return () => clearInterval(interval);
  }, []);

  const statsCards = useMemo(() => data.statsCards, [data.statsCards]);

  return {
    activityFeed: data.activityFeed,
    orderStatusDataset: data.orderStatusDataset,
    recentOrders: data.recentOrders,
    revenueDataset: data.revenueDataset,
    salesByLocation: data.salesByLocation,
    statsCards,
    storageUsage: data.storageUsage,
    userGrowthDataset: data.userGrowthDataset,
    contentStats: data.contentStats,
    subscriptionDistribution: data.subscriptionDistribution,
    monthlyRevenue: data.monthlyRevenue,
    usageDataset: data.usageDataset,
    recentTickets: data.recentTickets,
    loading,
    error,
    refresh: loadDashboard
  };
};
