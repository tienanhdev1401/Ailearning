import { useEffect, useMemo, useState } from 'react';
import {
  activityFeed,
  generateOrderStatus,
  generateRecentOrders,
  generateRevenueSeries,
  generateStatsCards,
  generateUserGrowthSeries,
  salesByLocation,
  storageUsage
} from '../data/dashboardData';

const clampValue = (value, min = 0) => (value < min ? min : value);

const formatStatsValue = (card) => {
  if (card.label === 'Revenue') return Math.max(20000, card.value);
  if (card.label === 'Total Users') return Math.max(1000, card.value);
  if (card.label === 'Avg. Response') return Math.max(1, card.value);
  return Math.max(100, card.value);
};

export const useDashboardData = () => {
  const [statsCards, setStatsCards] = useState(generateStatsCards());
  const [revenueSeries, setRevenueSeries] = useState(generateRevenueSeries());
  const [userGrowth, setUserGrowth] = useState(generateUserGrowthSeries());
  const [orderStatus] = useState(generateOrderStatus());
  const [recentOrders, setRecentOrders] = useState(generateRecentOrders());
  const [isUpdating, setIsUpdating] = useState(false);

  const statsWithFormattedValues = useMemo(() => (
    statsCards.map(card => ({
      ...card,
      value: formatStatsValue(card)
    }))
  ), [statsCards]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsUpdating(true);
      setStatsCards(prev => prev.map(card => {
        const deltaValue = card.label === 'Avg. Response'
          ? parseFloat((Math.random() * 0.6 - 0.3).toFixed(2))
          : Math.floor(Math.random() * 300) - 120;
        const nextValue = card.label === 'Avg. Response'
          ? parseFloat((card.value + deltaValue).toFixed(1))
          : card.value + deltaValue;
        const deltaPercentage = `${deltaValue >= 0 ? '+' : ''}${(Math.random() * 8 - 2).toFixed(1)}%`;

        return {
          ...card,
          value: clampValue(nextValue, card.label === 'Avg. Response' ? 0.5 : 0),
          delta: deltaPercentage,
          deltaVariant: deltaValue >= 0 ? 'text-success' : 'text-danger'
        };
      }));

      setRevenueSeries(generateRevenueSeries());
      setUserGrowth(generateUserGrowthSeries());
      setRecentOrders(generateRecentOrders());

      setTimeout(() => setIsUpdating(false), 600);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const revenueDataset = useMemo(() => ({
    labels: revenueSeries.map(item => item.label),
    revenue: revenueSeries.map(item => item.revenue),
    profit: revenueSeries.map(item => item.profit)
  }), [revenueSeries]);

  const userGrowthDataset = useMemo(() => ({
    labels: userGrowth.map(point => point.label),
    data: userGrowth.map(point => point.value)
  }), [userGrowth]);

  const orderStatusDataset = useMemo(() => ({
    labels: ['Completed', 'Processing', 'Pending', 'Cancelled'],
    data: [orderStatus.completed, orderStatus.processing, orderStatus.pending, orderStatus.cancelled]
  }), [orderStatus]);

  return {
    activityFeed,
    isUpdating,
    orderStatusDataset,
    recentOrders,
    revenueDataset,
    salesByLocation,
    statsCards: statsWithFormattedValues,
    storageUsage,
    userGrowthDataset
  };
};
