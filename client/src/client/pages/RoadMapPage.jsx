import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import api from '../../api/api';

const RoadMapPage = () => {
  const { id } = useParams(); // Lấy id từ URL
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const res = await api.get(`/roadmaps/${id}`);
        setRoadmap(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [id]);

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (!roadmap) return <div className="text-center mt-5">Không tìm thấy roadmap</div>;

  return (
    <div className="bg-warning bg-opacity-25 min-vh-100 py-4">
      <div className="container" style={{ maxWidth: '900px' }}>
        {/* Header */}
        <div className="position-relative mb-4">
          <div className="bg-warning rounded-4 p-4 shadow-lg">
            <h1 className="text-center fw-bold text-dark mb-0 fs-2">{roadmap.levelName}</h1>
          </div>
        </div>

        {/* Roadmap Info */}
        <div className="bg-white rounded-4 p-4 shadow my-4">
          <p className="text-secondary mb-0">{roadmap.description}</p>
        </div>

        {/* Start Here Badge */}
        <div className="mb-4">
          <span className="badge bg-warning text-dark fw-bold fs-6 px-4 py-3 rounded-pill border border-warning border-4">
            START HERE
          </span>
        </div>

        {/* Day List */}
        {roadmap.days.map((day) => (
          <div key={day.id} className="rounded-4 p-4 mb-3 shadow bg-light">
            <div className="d-flex align-items-center">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center border border-4 shadow-sm bg-secondary bg-opacity-25 border-secondary"
                style={{ width: '80px', height: '80px', fontSize: '2rem' }}
              >
                {day.dayNumber}
              </div>
              <div className="flex-grow-1 ms-3">
                <h2 className="fs-5 fw-bold mb-1 text-dark">Day {day.dayNumber}</h2>
                <p className="mb-0 text-secondary">{day.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoadMapPage;
