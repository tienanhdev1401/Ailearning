import { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';

const SalesByLocationCard = ({ data }) => {
  const sortedData = useMemo(() => [...data].sort((a, b) => b.value - a.value), [data]);

  const series = useMemo(() => sortedData.map((entry) => entry.value), [sortedData]);

  const options = useMemo(() => ({
    chart: {
      type: 'donut',
      toolbar: { show: false }
    },
    labels: sortedData.map((entry) => entry.name),
    colors: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f97316', '#ef4444'],
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
        }
      }
    },
    dataLabels: {
      enabled: true,
      dropShadow: { enabled: false },
      style: {
        fontSize: '12px',
        fontWeight: 'bold',
        colors: ['#fff']
      }
    },
    stroke: {
      width: 2,
      colors: ['#fff']
    },
    tooltip: {
      theme: 'light',
      y: { formatter: (val) => `${val} users` }
    },
    legend: { show: false }
  }), [sortedData]);

  return (
    <div className="card h-100">
      <div className="card-header border-0 pb-0">
        <h5 className="card-title mb-0">Top Roadmaps</h5>
      </div>
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-center mb-4 mt-2">
          <ReactApexChart options={options} series={series} type="donut" height={280} />
        </div>
        <div className="custom-legend mt-auto">
          {sortedData.map((item, idx) => (
            <div key={idx} className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-secondary" style={{ fontSize: '14px', fontWeight: 500 }}>
                {item.name}
              </span>
              <span className="text-dark" style={{ fontSize: '14px', fontWeight: 600 }}>
                {item.value} users
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SalesByLocationCard;
