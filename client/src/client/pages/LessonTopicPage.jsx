import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import lessonTopicEnum from "../../enums/lessonTopic.enum";
import DictationShadowingPopUpModal from "../components/DictationShadowingPopUpModal";

const LessonTopiCPage = () => {
  const [topicsData, setTopicsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const navigate = useNavigate();

  // Lấy danh sách slug (key) và tên thật
  const topicEntries = Object.entries(lessonTopicEnum); // [ [slug, tên thật], ... ]

  // Fetch data từ backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/lessons/latest-per-type");
        setTopicsData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center mt-5">⏳ Đang tải dữ liệu...</div>;
  }

  const handleNavigate = (slug, topicName) => {
    // URL dùng slug, nhưng backend nhận tên thật nếu cần
    navigate(`/topics/${slug}`, { state: { topicName } });
  };

  return (
    <div className="bg-light min-vh-100 px-4 py-4">
      <div className="container py-4" style={{ maxWidth: "1350px" }}>
        {/* TOPICS BUTTON LIST */}
        <div className="mb-5">
          <h2 className="mb-4">Tất cả chủ đề</h2>
          <div className="d-flex flex-wrap gap-2">
            {topicEntries.map(([slug, topicName]) => (
              <button
                key={slug}
                className="btn btn-outline-secondary rounded-pill px-4 py-2"
                style={{ fontSize: "16px", color: "#333", borderColor: "#1a1a2e", fontWeight: 550 }}
                onClick={() => handleNavigate(slug, topicName)}
              >
                # {topicName}
              </button>
            ))}
          </div>
        </div>

        {/* LOOP FROM API */}
        {Object.entries(topicsData).map(([topicName, lessons]) => (
          <div className="mb-5" key={topicName}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="mb-0" style={{ color: "#333", fontSize: "1.8rem", fontWeight: 600 }}>
                {topicName} <span className="text-muted fs-6">({lessons.length} bài học)</span>
              </h3>
              <button
                className="btn btn-link p-0"
                style={{ fontSize: "1.1rem" }}
                onClick={() => {
                  // Tìm slug từ tên thật
                  const entry = topicEntries.find(([_, name]) => name === topicName);
                  if (entry) handleNavigate(entry[0], topicName);
                }}
              >
                Xem tất cả →
              </button>
            </div>

            {/* CARD LIST */}
            <div className="row g-3">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="col-12 col-md-6 col-lg-3">
                  <div className="card h-100 shadow-sm position-relative"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedLesson(lesson)}
                  >
                    <div className="position-relative">
                      <img
                        src={lesson.thumbnail_url}
                        className="card-img-top"
                        alt={lesson.title}
                        style={{ height: "180px", objectFit: "cover" }}
                      />
                      <span className="badge bg-primary position-absolute top-0 end-0 m-2">
                        {lesson.level }
                      </span>
                      <div className="position-absolute bottom-0 start-0 m-2 d-flex gap-2">
                        <span className="badge bg-danger">YouTube</span>
                        <span className="badge bg-dark">{lesson.duration}</span>
                      </div>
                      <span className="badge bg-dark bg-opacity-75 position-absolute top-0 start-0 m-2">
                        🎧 {lesson.views || 0}
                      </span>
                    </div>
                    <div className="card-body d-flex flex-column" style={{ minHeight: "100px" }}>
                      <h6
                        className="card-title mb-2"
                        style={{ fontSize: "16px", fontWeight: 550, color: "#1a1a2e" }}
                      >
                        {lesson.title}
                      </h6>

                      {/* BADGES dưới đáy */}
                      <div className="mt-auto d-flex gap-3 flex-wrap">
                        <span
                          className="badge rounded-pill bg-light text-dark d-flex align-items-center gap-1"
                          style={{ padding: "4px 10px", fontSize: "16px", fontWeight: 500 }}
                        >
                          Dictation
                          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: "-1px" }}><circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path></svg>
                        </span>

                        <span
                          className="badge rounded-pill bg-light text-dark d-flex align-items-center gap-1"
                          style={{ padding: "4px 10px", fontSize: "16px", fontWeight: 500 }}
                        >
                          Shadowing
                          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: "-1px" }}><circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path></svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* POPUP COMPONENT */}
      <DictationShadowingPopUpModal
        lesson={selectedLesson}
        onClose={() => setSelectedLesson(null)}
      />
    </div>
  );
};

export default LessonTopiCPage;
