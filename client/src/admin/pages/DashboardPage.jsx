import ActivityFeedCard from '../components/dashboard/ActivityFeedCard';
import OrderStatusCard from '../components/dashboard/OrderStatusCard';
import RecentOrdersCard from '../components/dashboard/RecentOrdersCard';
import RevenueOverviewCard from '../components/dashboard/RevenueOverviewCard';
import SalesByLocationCard from '../components/dashboard/SalesByLocationCard';
import StatsGrid from '../components/dashboard/StatsGrid';
import StorageStatusCard from '../components/dashboard/StorageStatusCard';
import UserGrowthCard from '../components/dashboard/UserGrowthCard';
import { useDashboardData } from '../hooks/useDashboardData';

const DashboardPage = () => {
  const {
    activityFeed,
    orderStatusDataset,
    recentOrders,
    revenueDataset,
    salesByLocation,
    statsCards,
    storageUsage,
    userGrowthDataset,
    // loading,
    error,
    // refresh
  } = useDashboardData();



  return (
    <div className="container-fluid p-4 p-lg-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0">Dashboard</h1>
          <p className="text-muted mb-0">Welcome back! Here's what's happening.</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {/* <button type="button" className="btn btn-primary">
            <i className="bi bi-plus-lg me-2" />
            New Item
          </button>
          <button type="button" className="btn btn-outline-secondary" title="Refresh data" onClick={refresh}>
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            ) : (
              <i className="bi bi-arrow-clockwise" />
            )}
          </button>
          <button type="button" className="btn btn-outline-secondary" title="Export data">
            <i className="bi bi-download" />
          </button>
          <button type="button" className="btn btn-outline-secondary" title="Settings">
            <i className="bi bi-gear" />
          </button> */}
        </div>
      </div>

      <StatsGrid stats={statsCards} />

      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}

      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <RevenueOverviewCard dataset={revenueDataset} />
        </div>
        <div className="col-lg-4">
          <ActivityFeedCard items={activityFeed} />
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <UserGrowthCard dataset={userGrowthDataset} />
        </div>
        <div className="col-lg-6">
          <OrderStatusCard dataset={orderStatusDataset} />
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <RecentOrdersCard orders={recentOrders} />
        </div>
        <div className="col-lg-4">
          <StorageStatusCard usage={storageUsage} />
        </div>
      </div>

      <SalesByLocationCard data={salesByLocation} />
    </div>
  );
};

export default DashboardPage;
