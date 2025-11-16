import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import api from '../../api/api';

const LessonTopiCPage = () => {
  const [topicsData, setTopicsData] = useState({});
  const [loading, setLoading] = useState(true);

  const topics = [
    'Movie short clip',
    'Daily English Conversation',
    'Learning resources',
    'Listening Time (Shadowing)',
    'IELTS Listening',
    'US UK songs',
    'TOEIC Listening',
    'Entertainment',
    'BBC learning english',
    'VOA Learning English',
    'Toefl Listening',
    'Science and Facts',
    'Fairy Tales',
    'IPA',
    'News',
    'Vietnam Today',
    'TED',
    'Travel vlog',
    'Animals and wildlife',
    'Business English'
  ];

  // ---- FETCH DATA ----
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/lessons/latest-per-type");
        setTopicsData(res.data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center mt-5">⏳ Đang tải dữ liệu...</div>;
  }

  return (
    <div className="bg-light min-vh-100 px-4 py-4">
      <div className="container py-4" style={{ maxWidth: "1350px" }}>

        {/* TOPICS BUTTON LIST – GIỮ NGUYÊN */}
        <div className="mb-5">
          <h2 className="mb-4">Tất cả chủ đề</h2>
          <div className="d-flex flex-wrap gap-2">
            {topics.map((topic, index) => (
              <button
                key={index}
                className="btn btn-outline-secondary rounded-pill px-4 py-2"
                style={{ fontSize: '16px', 
                  color: '#333',      
                  borderColor: '#1a1a2e',  
                  fontWeight: 550 
                }}>
                # {topic}
              </button>
            ))}
          </div>
        </div>

        {/* ---- LOOP TỪ API: Movie short clip, Daily English Conversation, ... ---- */}
        {Object.entries(topicsData).map(([topicName, lessons]) => (
          <div className="mb-5" key={topicName}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="mb-0" style={{ color: '#333', fontSize: '1.8rem', fontWeight: 600 }}>
                {topicName} <span className="text-muted fs-6">({lessons.length} bài học)</span>
              </h3>
              <a href="#" className="text-decoration-none" style={{ color: '#007bff',fontSize:'1.1rem' }}>Xem tất cả →</a>
            </div>
            

            {/* CARD LIST */}
            <div className="row g-3">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="col-12 col-md-6 col-lg-3">
                  <div className="card h-100 shadow-sm position-relative">

                    <div className="position-relative">
                      <img
                        src={lesson.thumbnail_url}
                        className="card-img-top"
                        alt={lesson.title}
                        style={{ height: '180px', objectFit: 'cover' }}
                      />

                      {/* GẮN LEVEL từ DB. Nếu DB chưa có thì tạm B1 */}
                      <span className="badge bg-primary position-absolute top-0 end-0 m-2">
                        {lesson.level || "B1"}
                      </span>

                      <div className="position-absolute bottom-0 start-0 m-2 d-flex gap-2">
                        <span className="badge bg-danger">YouTube</span>
                        <span className="badge bg-dark">{lesson.duration}</span>
                      </div>

                      <span className="badge bg-dark bg-opacity-75 position-absolute top-0 start-0 m-2">
                        🎧 {lesson.views || 0}
                      </span>
                    </div>

                    <div className="card-body">
                      <h6 className="card-title mb-3" style={{ fontSize: '16px', fontWeight: 550, color: '#1a1a2e' }}>
                        {lesson.title}
                      </h6>
                    </div>

                  </div>
                </div>
              ))}
            </div>

          </div>
        ))}

      </div>

      <style jsx>{`
        .btn-gradient-primary {
          background: linear-gradient(135deg, #00d4ff 0%, #0099ff 50%, #9966ff 100%);
          border: none;
        }
        .btn-gradient-primary:hover {
          opacity: 0.9;
        }
        .z-index-1 { z-index: 1; }
      `}</style>
    </div>
  );
};

export default LessonTopiCPage;