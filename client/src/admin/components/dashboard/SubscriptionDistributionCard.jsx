import { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';

const SubscriptionDistributionCard = ({ distribution = { labels: [], data: [] } }) => {
  const safeDistribution = useMemo(() => ({
    labels: distribution?.labels || [],
    data: distribution?.data || []
  }), [distribution]);

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
    tooltip: { y: { formatter: (value) => `${value} active` } }
  }), [safeDistribution]);

  const series = useMemo(() => safeDistribution.data, [safeDistribution]);

  return (
    <div className="card h-100">
      <div className="card-header">
        <h5 className="card-title mb-0">Subscription Plans</h5>
      </div>
      <div className="card-body">
        <ReactApexChart options={chartOptions} series={series} type="donut" height={320} />
      </div>
    </div>
  );
};

export default SubscriptionDistributionCard;
