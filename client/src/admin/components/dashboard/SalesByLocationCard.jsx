import { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';

const SalesByLocationCard = ({ data }) => {
  const chartData = useMemo(() => ([{
    name: 'Sales',
    data: data.map((entry) => ({ x: entry.name, y: entry.value }))
  }]), [data]);

  const options = useMemo(() => ({
    chart: {
      type: 'treemap',
      toolbar: {
        show: true,
        tools: { download: true }
      }
    },
    legend: { show: false },
    dataLabels: {
      enabled: true,
      style: { fontSize: '12px' },
      formatter: (text, opts) => `${text}: ${opts.value}`
    },
    plotOptions: {
      treemap: {
        enableShades: true,
        shadeIntensity: 0.5,
        colorScale: {
          ranges: [
            { from: 0, to: 1000, color: '#CDD7B6' },
            { from: 1001, to: 2000, color: '#A4B494' },
            { from: 2001, to: 3000, color: '#52708E' }
          ]
        }
      }
    }
  }), []);

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">Sales by Location</h5>
      </div>
      <div className="card-body">
        <ReactApexChart options={options} series={chartData} type="treemap" height={400} />
      </div>
    </div>
  );
};

export default SalesByLocationCard;
