import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import api from '../../api/api';

const RoadMapPage = () => {
  const { id } = useParams(); // roadmapId
  const navigate = useNavigate();
  const userId = 1; // TODO: thay bằng userId thực tế từ auth
  const [roadmap, setRoadmap] = useState(null);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        // 1️⃣ Kiểm tra enroll
        const checkRes = await api.get(`/roadmap_enrollments/user/${userId}/roadmap/${id}`);
        if (checkRes.data.enrolled) {
          setEnrolled(true);
          setRoadmap(checkRes.data.roadmap_enrollement.roadmap);
          // fetch ngày đã enroll
          const daysRes = await api.get(`/users/${userId}/roadmaps/${id}/days`);
          setDays(daysRes.data.data);
        } else {
          // chưa enroll → fetch roadmap để preview
          const roadmapRes = await api.get(`/roadmaps/${id}`);
          setRoadmap(roadmapRes.data);
          setDays(roadmapRes.data.days || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [id, userId]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await api.post(`/roadmap_enrollments/enroll`, {
        userId,
        roadmapId: Number(id),
      });
      setEnrolled(true);
      // fetch ngày sau khi enroll
      const daysRes = await api.get(`/users/${userId}/roadmaps/${id}/days`);
      setDays(daysRes.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setEnrolling(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-white'; // xanh lá
      case 'in_progress':
        return 'bg-warning text-dark'; // vàng
      case 'not_started':
        return 'bg-primary text-white'; // xanh biển
      case 'locked':
      default:
        return 'bg-secondary text-white bg-opacity-25'; // xám
    }
  };

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

        {/* Nút Bắt đầu học (Preview UI) */}
        {!enrolled && (
          <div className="mb-4 text-center">
            <button
              className="btn btn-warning fw-bold px-5 py-3 rounded-pill"
              onClick={handleEnroll}
              disabled={enrolling}
            >
              {enrolling ? 'Đang enroll...' : 'Bắt đầu học'}
            </button>
          </div>
        )}

        {/* Danh sách ngày */}
        {days.map((day) => (
          <div
            key={day.id}
            className={`rounded-4 p-4 mb-3 shadow d-flex align-items-center ${
              enrolled ? getStatusClass(day.status) : 'bg-light'
            }`}
            style={{ cursor: enrolled && day.status !== 'locked' ? 'pointer' : 'not-allowed' }}
            onClick={() => {
              if (enrolled && day.status !== 'locked') {
                navigate(`/days/${day.id}`); 
              }
            }}
          >
            <div
              className={`rounded-circle d-flex align-items-center justify-content-center border border-4 shadow-sm ${
                enrolled ? '' : 'bg-secondary bg-opacity-25 border-secondary'
              }`}
              style={{ width: '80px', height: '80px', fontSize: '2rem' }}
            >
              {day.dayNumber}
            </div>
            <div className="flex-grow-1 ms-3">
              <h2 className="fs-5 fw-bold mb-1 text-dark">Day {day.dayNumber}</h2>
              <p className="mb-0 text-dark">{day.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoadMapPage;
