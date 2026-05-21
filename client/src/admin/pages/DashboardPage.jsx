import ActivityFeedCard from '../components/dashboard/ActivityFeedCard';
import RecentTransactionsCard from '../components/dashboard/RecentTransactionsCard';
import RecentTicketsCard from '../components/dashboard/RecentTicketsCard';
import FinancialOverviewCard from '../components/dashboard/FinancialOverviewCard';
import UsageOverviewCard from '../components/dashboard/UsageOverviewCard';
import SalesByLocationCard from '../components/dashboard/SalesByLocationCard';
import StatsGrid from '../components/dashboard/StatsGrid';
import SubscriptionDistributionCard from '../components/dashboard/SubscriptionDistributionCard';
import ContentStatsCard from '../components/dashboard/ContentStatsCard';

import UserGrowthCard from '../components/dashboard/UserGrowthCard';
import { useDashboardData } from '../hooks/useDashboardData';

const DashboardPage = () => {
  const {
    activityFeed,
    recentOrders,
    recentTickets,
    revenueDataset,
    usageDataset,
    salesByLocation,
    statsCards,
    userGrowthDataset,
    contentStats,
    subscriptionDistribution,
    loading,
    error
  } = useDashboardData();

  return (
    <div className="container-fluid p-4 p-lg-5">
      <div className="admin-page-header">
        <div className="header-info">
          <h1 className="mb-0">Admin Dashboard</h1>
          <p>Platform overview and real-time analytics.</p>
        </div>
      </div>

      <StatsGrid stats={statsCards} />

      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}

      {/* Row 1: Charts */}
      <div className="row g-4 mb-4">
        <div className="col-lg-12">
          <FinancialOverviewCard dataset={revenueDataset} />
        </div>
      </div>

      {/* Row 2: Usage & Content */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <UsageOverviewCard dataset={usageDataset} />
        </div>
        <div className="col-lg-4">
          <ContentStatsCard stats={contentStats} />
        </div>
      </div>

      {/* Row 3: Tables */}
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <RecentTransactionsCard orders={recentOrders} />
        </div>
        <div className="col-lg-6">
          <RecentTicketsCard tickets={recentTickets} />
        </div>
      </div>

      {/* Row 4: Dist & Growth */}
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <SubscriptionDistributionCard distribution={subscriptionDistribution} loading={loading} />
        </div>
        <div className="col-lg-6">
          <UserGrowthCard dataset={userGrowthDataset} />
        </div>
      </div>

      {/* Row 5: Feed & Location */}
      <div className="row g-4 mb-4">
        <div className="col-lg-4">
          <ActivityFeedCard items={activityFeed} />
        </div>
        <div className="col-lg-8">
          <SalesByLocationCard data={salesByLocation} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
