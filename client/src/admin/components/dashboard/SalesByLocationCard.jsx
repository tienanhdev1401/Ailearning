import { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';

const SalesByLocationCard = ({ data }) => {
  const sortedData = useMemo(() => [...data].sort((a, b) => b.value - a.value), [data]);

  const chartData = useMemo(() => ([{
    name: 'Enrollments',
    data: sortedData.map((entry) => entry.value)
  }]), [sortedData]);

  const options = useMemo(() => ({
    chart: {
      type: 'bar',
      toolbar: { show: true, tools: { download: true } }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        distributed: true,
        borderRadius: 10,
        barHeight: '55%',
        dataLabels: {
          position: 'center'
        }
      }
    },
    yaxis: {
      categories: sortedData.map((entry) => entry.name),
      labels: { style: { fontSize: '12px', fontWeight: 600 }, maxWidth: 260 }
    },
    xaxis: {
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false }
    },
    dataLabels: {
      enabled: true,
      offsetX: 0,
      style: { fontSize: '12px', fontWeight: 700, colors: ['#f8fafc'] },
      background: {
        enabled: true,
        borderRadius: 10,
        padding: 7,
        opacity: 0.9,
        foreColor: '#0b1225',
        borderWidth: 0,
        dropShadow: {
          enabled: true,
          top: 0,
          left: 0,
          blur: 4,
          opacity: 0.25
        }
      },
      formatter: (val, opts) => {
        const name = opts.w.config.yaxis[0].categories[opts.dataPointIndex];
        return `${name}: ${val.toLocaleString()} enrollments`;
      }
    },
    colors: ['#3B82F6', '#06B6D4', '#10B981', '#84CC16', '#F59E0B', '#F97316', '#EF4444'],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        shadeIntensity: 0.2,
        inverseColors: false,
        opacityFrom: 0.95,
        opacityTo: 0.95,
        stops: [0, 60, 100]
      }
    },
    grid: { strokeDashArray: 3, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
    tooltip: {
      theme: 'light',
      y: { formatter: (val) => `${val.toLocaleString()} enrollments` }
    },
    legend: { show: false }
  }), [sortedData]);

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">Enrollments by Roadmap</h5>
      </div>
      <div className="card-body">
        <ReactApexChart options={options} series={chartData} type="bar" height={420} />
      </div>
    </div>
  );
};

export default SalesByLocationCard;
