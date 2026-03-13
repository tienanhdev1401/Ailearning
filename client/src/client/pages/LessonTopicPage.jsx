import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import lessonTopicEnum from "../../enums/lessonTopic.enum";
import DictationShadowingPopUpModal from "../components/DictationShadowingPopUpModal";
import { fetchTopicLessonOverview, selectTopicLessonOverviewState } from "../../features/lessons/topicLessonOverviewSlice";

const LessonTopiCPage = () => {
  const dispatch = useDispatch();
  const { data: topicsData, status, error } = useSelector(selectTopicLessonOverviewState);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const navigate = useNavigate();

  // Lấy danh sách slug (key) và tên thật
  const topicEntries = Object.entries(lessonTopicEnum); // [ [slug, tên thật], ... ]

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchTopicLessonOverview());
    }
  }, [status, dispatch]);

  const hasData = topicsData && Object.keys(topicsData).length > 0;

  if (status === "loading" && !hasData) {
    return <div className="text-center mt-5">⏳ Đang tải dữ liệu...</div>;
  }

  if (status === "failed" && !hasData) {
    return (
      <div className="text-center mt-5 text-danger">
        Không thể tải danh sách chủ đề. {error}
      </div>
    );
  }

  const handleNavigate = (slug, topicName) => {
    // URL dùng slug, nhưng backend nhận tên thật nếu cần
    navigate(`/topics/${slug}`, { state: { topicName } });
  };

  return (
    <div className="bg-body text-body min-vh-100 px-4 py-4">
      <div className="container py-4" style={{ maxWidth: "1350px" }}>
        {/* TOPICS BUTTON LIST */}
        <div className="mb-5">
          <h2 className="mb-4">Tất cả chủ đề</h2>
          <div className="d-flex flex-wrap gap-2">
            {topicEntries.map(([slug, topicName]) => (
              <button
                key={slug}
                className="btn btn-outline-secondary rounded-pill px-4 py-2"
                style={{ fontSize: "16px", fontWeight: 550 }}
                onClick={() => handleNavigate(slug, topicName)}
              >
                # {topicName}
              </button>
            ))}
          </div>
        </div>

        {/* LOOP FROM API */}
        {Object.entries(topicsData || {}).map(([topicName, lessons]) => (
          <div className="mb-5" key={topicName}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="mb-0" style={{ fontSize: "1.8rem", fontWeight: 600 }}>
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
                        {lesson.level}
                      </span>
                      <div className="position-absolute bottom-0 start-0 m-2 d-flex gap-2">
                        <span className="badge bg-danger">YouTube</span>
                        <span className="badge bg-dark">{lesson.duration}</span>
                      </div>
                      <span className="badge bg-dark bg-opacity-75 position-absolute top-0 start-0 m-2">
                        🎧 {lesson.views || 0}
                      </span>
                      {lesson.isLock && (
                        <div
                          className="position-absolute d-flex align-items-center justify-content-center text-white rounded-circle border border-2 border-white shadow-sm"
                          style={{
                            bottom: "5px",
                            right: "5px",
                            width: "45px",
                            height: "45px",
                            opacity: "0.95",
                            background: "linear-gradient(135deg, #ff9a00 0%, #ff5e00 100%)",
                            boxShadow: "0 4px 15px rgba(255, 154, 0, 0.4)",
                            zIndex: 5
                          }}
                          title="VIP Lesson"
                        >
                          <span style={{ fontSize: "20px" }}>💎</span>
                          <span style={{ fontSize: "9px", fontWeight: "bold", position: "absolute", bottom: "3px" }}>VIP</span>
                        </div>
                      )}
                    </div>
                    <div className="card-body d-flex flex-column" style={{ minHeight: "100px" }}>
                      <h6
                        className="card-title mb-2"
                        style={{ fontSize: "16px", fontWeight: 550 }}
                      >
                        {lesson.title}
                      </h6>

                      {/* BADGES dưới đáy */}
                      <div className="mt-auto d-flex gap-3 flex-wrap">
                        <span
                          className="badge rounded-pill bg-body-secondary text-body d-flex align-items-center gap-1"
                          style={{ padding: "4px 10px", fontSize: "16px", fontWeight: 500 }}
                        >
                          Dictation
                          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: "-1px" }}><circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path></svg>
                        </span>

                        <span
                          className="badge rounded-pill bg-body-secondary text-body d-flex align-items-center gap-1"
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

        {status === "failed" && (
          <div className="alert alert-warning mt-4" role="alert">
            Không thể tải dữ liệu mới nhất: {error}
          </div>
        )}
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
