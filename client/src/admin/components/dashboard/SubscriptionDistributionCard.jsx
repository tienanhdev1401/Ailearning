import { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';

const SubscriptionDistributionCard = ({ distribution = { labels: [], data: [] }, loading = false }) => {
  const safeDistribution = useMemo(() => ({
    labels: distribution?.labels || [],
    data: distribution?.data || []
  }), [distribution]);

  const hasData = safeDistribution.data.length > 0;

  const chartOptions = useMemo(() => ({
    chart: { type: 'donut' },
    labels: safeDistribution.labels,
    colors: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: () => safeDistribution.data.reduce((a, b) => a + b, 0)
            }
          }
        }
      }
    },
    legend: { position: 'bottom' },
    noData: {
      text: 'No subscription data available',
      align: 'center',
      verticalAlign: 'middle',
      style: { fontSize: '14px' }
    }
  }), [safeDistribution]);

  const series = useMemo(() => safeDistribution.data, [safeDistribution]);

  return (
    <div className="card h-100 shadow-sm border-0">
      <div className="card-header bg-transparent border-0 pt-4 px-4">
        <h5 className="card-title mb-0 fw-bold">Subscription Distribution</h5>
      </div>
      <div className="card-body px-4 pb-4">
        {loading ? (
          <div className="d-flex justify-content-center align-items-center h-100" style={{ minHeight: '250px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : !hasData ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-pie-chart fs-1 mb-3 d-block opacity-25" />
            <p className="mb-0">No active subscriptions found</p>
          </div>
        ) : (
          <ReactApexChart options={chartOptions} series={series} type="donut" height={320} />
        )}
      </div>
    </div>
  );
};

export default SubscriptionDistributionCard;
