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
    case '7d': return dataset.slice(-7);
    case '30d': return dataset.slice(-10);
    case '90d': return dataset.slice(-12);
    case '1y':
    default: return dataset;
  }
};

const UsageOverviewCard = ({ dataset = { labels: [], aiConversations: [], resolvedTickets: [] } }) => {
  const [period, setPeriod] = useState('7d');
  const chartRef = useRef(null);
  const canvasRef = useRef(null);

  const filteredData = useMemo(() => {
    const labels = dataset?.labels || [];
    const ai = dataset?.aiConversations || [];
    const tickets = dataset?.resolvedTickets || [];
    
    return sliceDataByPeriod(labels.map((label, idx) => ({
      label,
      ai: ai[idx] || 0,
      tickets: tickets[idx] || 0
    })), period);
  }, [dataset, period]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    chartRef.current?.destroy();

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: filteredData.map((point) => point.label),
        datasets: [
          {
            label: 'AI Conversations',
            data: filteredData.map((point) => point.ai),
            backgroundColor: 'rgba(99, 102, 241, 0.8)',
            borderRadius: 4
          },
          {
            label: 'Resolved Tickets',
            data: filteredData.map((point) => point.tickets),
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { usePointStyle: true } },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: { 
            beginAtZero: true, 
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
            ticks: { callback: (val) => val.toLocaleString() }
          }
        }
      }
    });

    return () => chartRef.current?.destroy();
  }, [filteredData]);

  return (
    <div className="card h-100">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="card-title mb-0">System Usage Overview</h5>
        <div className="btn-group btn-group-sm">
          {PERIODS.map((opt) => (
            <button
              key={opt.value}
              className={`btn btn-outline-secondary ${period === opt.value ? 'active' : ''}`}
              onClick={() => setPeriod(opt.value)}
            >
              {opt.label}
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

export default UsageOverviewCard;
