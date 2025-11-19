import { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';

const StorageStatusCard = ({ usage }) => {
  const chartOptions = useMemo(() => ({
    chart: { type: 'radialBar', sparkline: { enabled: true } },
    plotOptions: {
      radialBar: {
        hollow: { size: '70%' },
        dataLabels: {
          name: { show: true, color: '#94a3b8', fontSize: '14px', offsetY: -10 },
          value: { show: true, fontSize: '32px', formatter: (val) => `${Math.round(val)}%` }
        }
      }
    },
    colors: ['#20E647'],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        gradientToColors: ['#87D4F9'],
        shadeIntensity: 0.5,
        type: 'vertical',
        stops: [0, 100]
      }
    },
    stroke: { lineCap: 'round' },
    labels: ['Used Space']
  }), []);

  const series = useMemo(() => [usage.used], [usage]);

  return (
    <div className="card h-100">
      <div className="card-header">
        <h5 className="card-title mb-0">Storage Status</h5>
      </div>
      <div className="card-body">
        <ReactApexChart options={chartOptions} series={series} type="radialBar" height={280} />
        <div className="text-center mt-3">
          <p className="text-muted mb-1">Total Capacity</p>
          <h4 className="mb-0">{usage.total} GB</h4>
        </div>
      </div>
    </div>
  );
};

export default StorageStatusCard;
