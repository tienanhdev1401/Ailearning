import { useEffect, useMemo, useRef, useState } from 'react';
import Chart from '../../lib/chart';

const PERIODS = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: '1Y', value: '1y' }
];

const sliceDataByPeriod = (dataset, period) => {
  switch (period) {
    case '7d':
      return dataset.slice(-7);
    case '30d':
      return dataset.slice(-10);
    case '90d':
      return dataset.slice(-12);
    case '1y':
    default:
      return dataset;
  }
};

const RevenueOverviewCard = ({ dataset }) => {
  const [period, setPeriod] = useState('7d');
  const chartRef = useRef(null);
  const canvasRef = useRef(null);

  const filteredData = useMemo(() => sliceDataByPeriod(dataset.labels.map((label, idx) => ({
    label,
    revenue: dataset.revenue[idx],
    profit: dataset.profit[idx]
  })), period), [dataset, period]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    chartRef.current?.destroy();

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: filteredData.map((point) => point.label),
        datasets: [
          {
            label: 'AI Conversations',
            data: filteredData.map((point) => point.revenue),
            borderColor: 'rgb(99, 102, 241)',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgb(99, 102, 241)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5
          },
          {
            label: 'Resolved Tickets',
            data: filteredData.map((point) => point.profit),
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgb(16, 185, 129)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(148, 163, 184, 0.2)' },
            ticks: {
              callback: (value) => value.toLocaleString()
            },
            border: { display: false }
          }
        }
      }
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [filteredData]);

  return (
    <div className="card h-100">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="card-title mb-0">Usage Overview</h5>
        <div className="btn-group btn-group-sm" role="group">
          {PERIODS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`btn btn-outline-primary ${period === option.value ? 'active' : ''}`}
              onClick={() => setPeriod(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="card-body">
        <canvas ref={canvasRef} height="250" />
      </div>
    </div>
  );
};

export default RevenueOverviewCard;
