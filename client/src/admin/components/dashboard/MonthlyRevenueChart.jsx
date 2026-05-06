import { useEffect, useMemo, useRef } from 'react';
import Chart from '../../lib/chart';

const MonthlyRevenueChart = ({ data = [] }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const chartData = useMemo(() => ({
    labels: data.map(item => item.month),
    revenue: data.map(item => item.revenue),
    transactions: data.map(item => item.transactions)
  }), [data]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    chartRef.current?.destroy();

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Revenue (₫)',
            data: chartData.revenue,
            backgroundColor: 'rgba(99, 102, 241, 0.8)',
            borderColor: 'rgb(99, 102, 241)',
            borderWidth: 1,
            borderRadius: 6,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const index = context.dataIndex;
                const item = data[index];
                return [
                  `Revenue: ${context.parsed.y.toLocaleString()} ₫`,
                  `Transactions: ${item.transactions} giao dịch`,
                  `Growth: ${item.growth}`
                ];
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
            ticks: {
              callback: (val) => val >= 1000000 ? (val / 1000000) + 'M' : val.toLocaleString() + ' ₫'
            }
          }
        }
      }
    });

    return () => chartRef.current?.destroy();
  }, [chartData, data]);

  return (
    <div className="card h-100">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="card-title mb-0">Monthly Revenue (Dạng cột)</h5>
        <span className="badge bg-primary-subtle text-primary-emphasis">Last 6 Months</span>
      </div>
      <div className="card-body">
        <div style={{ height: '300px' }}>
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
};

export default MonthlyRevenueChart;
