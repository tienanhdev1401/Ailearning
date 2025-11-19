import { useEffect, useRef } from 'react';
import Chart from '../../lib/chart';

const UserGrowthCard = ({ dataset }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    chartRef.current?.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: dataset.labels,
        datasets: [
          {
            label: 'New Users',
            data: dataset.data,
            backgroundColor: 'rgba(99, 102, 241, 0.8)',
            borderRadius: 8,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(148, 163, 184, 0.2)' }
          }
        }
      }
    });

    return () => chartRef.current?.destroy();
  }, [dataset]);

  return (
    <div className="card h-100">
      <div className="card-header">
        <h5 className="card-title mb-0">User Growth (Last 14 Days)</h5>
      </div>
      <div className="card-body">
        <canvas ref={canvasRef} height="200" />
      </div>
    </div>
  );
};

export default UserGrowthCard;
