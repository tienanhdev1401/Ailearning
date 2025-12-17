import { useEffect, useMemo, useState } from 'react';
import dashboardService from '../services/dashboardService';
import {
  activityFeed as mockActivityFeed,
  generateOrderStatus,
  generateRecentOrders,
  generateRevenueSeries,
  generateStatsCards,
  generateUserGrowthSeries,
  salesByLocation as mockSales,
  storageUsage as mockStorage
} from '../data/dashboardData';

const fallbackData = {
  statsCards: generateStatsCards(),
  revenueDataset: (() => {
    const series = generateRevenueSeries();
    return {
      labels: series.map((s) => s.label),
      revenue: series.map((s) => s.revenue),
      profit: series.map((s) => s.profit)
    };
  })(),
  userGrowthDataset: (() => {
    const series = generateUserGrowthSeries();
    return {
      labels: series.map((s) => s.label),
      data: series.map((s) => s.value)
    };
  })(),
  orderStatusDataset: (() => {
    const status = generateOrderStatus();
    return {
      labels: ['Completed', 'Processing', 'Pending', 'Cancelled'],
      data: [status.completed, status.processing, status.pending, status.cancelled]
    };
  })(),
  recentOrders: generateRecentOrders(),
  activityFeed: mockActivityFeed,
  storageUsage: mockStorage,
  salesByLocation: mockSales
};

export const useDashboardData = () => {
  const [data, setData] = useState(fallbackData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const result = await dashboardService.getOverview();
      setData({ ...fallbackData, ...result });
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
    loading,
    error,
    refresh: loadDashboard
  };
};
