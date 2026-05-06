import ActivityFeedCard from '../components/dashboard/ActivityFeedCard';
import OrderStatusCard from '../components/dashboard/OrderStatusCard';
import RecentTransactionsCard from '../components/dashboard/RecentTransactionsCard';
import RecentTicketsCard from '../components/dashboard/RecentTicketsCard';
import FinancialOverviewCard from '../components/dashboard/FinancialOverviewCard';
import UsageOverviewCard from '../components/dashboard/UsageOverviewCard';
import SalesByLocationCard from '../components/dashboard/SalesByLocationCard';
import StatsGrid from '../components/dashboard/StatsGrid';
import SubscriptionDistributionCard from '../components/dashboard/SubscriptionDistributionCard';
import ContentStatsCard from '../components/dashboard/ContentStatsCard';
import MonthlyRevenueChart from '../components/dashboard/MonthlyRevenueChart';
import UserGrowthCard from '../components/dashboard/UserGrowthCard';
import { useDashboardData } from '../hooks/useDashboardData';

const DashboardPage = () => {
  const {
    activityFeed,
    orderStatusDataset,
    recentOrders,
    recentTickets,
    revenueDataset,
    usageDataset,
    salesByLocation,
    statsCards,
    userGrowthDataset,
    contentStats,
    subscriptionDistribution,
    monthlyRevenue,
    error
  } = useDashboardData();

  return (
    <div className="container-fluid p-4 p-lg-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0">Admin Dashboard</h1>
          <p className="text-muted mb-0">Platform overview and real-time analytics.</p>
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
        <div className="col-lg-8">
          <FinancialOverviewCard dataset={revenueDataset} />
        </div>
        <div className="col-lg-4">
          <UsageOverviewCard dataset={usageDataset} />
        </div>
      </div>

      {/* Row 2: Monthly Breakdown & Content */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <MonthlyRevenueChart data={monthlyRevenue} />
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
        <div className="col-lg-4">
          <SubscriptionDistributionCard distribution={subscriptionDistribution} />
        </div>
        <div className="col-lg-4">
          <UserGrowthCard dataset={userGrowthDataset} />
        </div>
        <div className="col-lg-4">
          <OrderStatusCard dataset={orderStatusDataset} />
        </div>
      </div>

      {/* Row 5: Feed & Location */}
      <div className="row g-4 mb-4">
        <div className="col-lg-4">
          <ActivityFeedCard items={activityFeed} />
        </div>
        <div className="col-lg-8">
          <SalesByLocationCard data={salesByLocation} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
