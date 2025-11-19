import { useEffect, useRef } from 'react';
import Chart from '../../lib/chart';

const COLORS = ['rgba(16, 185, 129, 0.85)', 'rgba(99, 102, 241, 0.85)', 'rgba(245, 158, 11, 0.85)', 'rgba(239, 68, 68, 0.85)'];

const OrderStatusCard = ({ dataset }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: dataset.labels,
        datasets: [
          {
            data: dataset.data,
            backgroundColor: COLORS,
            borderWidth: 0,
            cutout: '60%'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, padding: 16 }
          }
        }
      }
    });

    return () => chartRef.current?.destroy();
  }, [dataset]);

  return (
    <div className="card h-100">
      <div className="card-header">
        <h5 className="card-title mb-0">Order Status Distribution</h5>
      </div>
      <div className="card-body">
        <canvas ref={canvasRef} height="200" />
      </div>
    </div>
  );
};

export default OrderStatusCard;
