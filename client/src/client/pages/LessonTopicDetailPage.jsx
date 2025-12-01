import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import lessonTopicEnum from "../../enums/lessonTopic.enum";
import {
  fetchLessons,
  resetTopicState,
  selectLessons,
} from "../../features/lessons/lessonsSlice";

const LESSONS_PER_PAGE = 8;

const LEVELS = [
  { value: "All", label: "Tất cả cấp độ" },
  { value: "A1", label: "A1 - Người mới bắt đầu" },
  { value: "A2", label: "A2 - Sơ cấp" },
  { value: "B1", label: "B1 - Trung cấp thấp" },
  { value: "B2", label: "B2 - Trung cấp cao" },
  { value: "C1", label: "C1 - Nâng cao" },
  { value: "C2", label: "C2 - Thành thạo" },
];

const TopicDetailPage = () => {
  const dispatch = useDispatch();
  const { topic: slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const topicName =
    (location.state && location.state.topicName) ||
    (Object.entries(lessonTopicEnum).find(([key, name]) => key === slug) || [])[1] ||
    slug;

  const [sortBy, setSortBy] = useState("latest");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("All");
  const lastLessonRef = useRef(null);

  const topicKey = slug || topicName;
  const paramsKey = `${topicKey}|${sortBy}|${search}|${level}`;

  const {
    items: lessons,
    page,
    hasMore,
    status,
    loadingMore,
    error,
  } = useSelector((state) => selectLessons(state, topicKey));

  useEffect(() => {
    if (!topicKey || !topicName) {
      return;
    }

    dispatch(resetTopicState({ topicKey, paramsKey }));
    dispatch(
      fetchLessons({
        topicKey,
        topicType: topicName,
        sortBy,
        search,
        level,
        page: 1,
        limit: LESSONS_PER_PAGE,
        paramsKey,
      })
    );
  }, [dispatch, topicKey, topicName, sortBy, search, level, paramsKey]);

  useEffect(() => {
    if (!hasMore || loadingMore || status === "loading") {
      return;
    }

    const target = lastLessonRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          observer.unobserve(entry.target);
          dispatch(
            fetchLessons({
              topicKey,
              topicType: topicName,
              sortBy,
              search,
              level,
              page,
              limit: LESSONS_PER_PAGE,
              paramsKey,
            })
          );
        }
      },
      { threshold: 1 }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [dispatch, hasMore, loadingMore, status, topicKey, topicName, sortBy, search, level, page, lessons.length, paramsKey]);

  return (
    <div className="bg-light min-vh-100 px-4 py-4">
      <div className="container py-4" style={{ maxWidth: "1350px" }}>
        {/* Quay lại tất cả chủ đề */}
        <div className="mb-3">
          <button
            className="btn p-0"
            style={{ color: "#585155ff", fontWeight: 500, fontSize: "18px" }}
            onClick={() => navigate("/topics")}
          >
            ← Quay lại tất cả chủ đề
          </button>
        </div>

        {/* Tiêu đề topic + tổng số bài học bên phải */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 style={{ fontSize: "2rem", fontWeight: 600 }}>{topicName}</h2>
          <div style={{ color: "#6c757d", fontSize: "1.2rem" }}>
            Tổng số bài học: {lessons.length}
          </div>
        </div>

        {/* Filter box */}
        <div
          className="p-3 mb-4 rounded-4"
          style={{ 
            backgroundColor: "#fafafa", 
            borderRadius: "50px",  
            border: "1px solid rgba(0,0,0,0.1)", 
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)" 
          }}
        >
          {/* Filter title */}
          <div className="d-flex align-items-center mb-3" style={{ fontWeight: 600, fontSize: "20px", color: "#1a1a2e" }}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="black"
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="me-2 text-primary"
            >
              <path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"></path>
            </svg>
            Bộ lọc
          </div>

          {/* Search & Filters */}
          <div className="d-flex gap-4 flex-wrap align-items-center" style={{ height: "50px" }}>
            {/* Search input */}
            <div className="position-relative" style={{ width:"700px"}}>
              <span className="position-absolute top-50 start-0 translate-middle-y ms-3" style={{ color: "#6c757d" }}>🔍</span>
              <input
                type="text"
                placeholder="Tìm kiếm bài học..."
                className="form-control ps-5"
                style={{ borderRadius: "8px", border: "1px solid #dee2e6", fontSize: "1.1rem", fontWeight: 500 }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Level dropdown */}
            <div className="position-relative" style={{ width: "300px" }}>
              <span className="position-absolute top-50 start-0 translate-middle-y ms-3" style={{ color: "#6c757d", zIndex: 10 }}>⚙️</span>
              <select
                className="form-select ps-5"
                style={{ borderRadius: "8px", border: "1px solid #dee2e6", fontSize: "1.1rem", fontWeight: 500 }}
                value={level}
                onChange={e => setLevel(e.target.value)}
              >
                {LEVELS.map(lvl => (
                  <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
                ))}
              </select>
            </div>

            {/* Sort dropdown */}
            <div className="position-relative" style={{ width: "200px" }}>
              <span className="position-absolute top-50 start-0 translate-middle-y ms-3" style={{ color: "#6c757d", zIndex: 10 }}>🕐</span>
              <select
                className="form-select ps-5"
                style={{ borderRadius: "8px", border: "1px solid #dee2e6", fontSize: "1.1rem" }}
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="latest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="views">Nhiều lượt xem</option>
                <option value="least_views">Ít lượt xem</option>
                <option value="longest">Video Dài</option>
                <option value="shortest">Video Ngắn</option>
              </select>
            </div>
          </div>

          {/* Active filters */}
          {(level !== "All" || search || sortBy !== "latest") && (
            <div className="mt-3">
              <div className="mb-2 fw-semibold" style={{ fontSize: "1.1rem", color: "#707079ff" }}>
                Bộ lọc đang hoạt động:
              </div>
              <div className="d-flex gap-2 flex-wrap">
                {level !== "All" && (
                  <span className="badge bg-primary d-flex align-items-center" style={{ fontSize: "1rem" }}>
                    Level: {level}
                    <button type="button" className="btn-close btn-close-white ms-2" aria-label="Close" onClick={() => setLevel("All")}></button>
                  </span>
                )}
                {search && (
                  <span className="badge bg-secondary d-flex align-items-center" style={{ fontSize: "1rem" }}>
                    Search: "{search}"
                    <button type="button" className="btn-close btn-close-white ms-2" aria-label="Close" onClick={() => setSearch("")}></button>
                  </span>
                )}
                {sortBy !== "latest" && (
                  <span className="badge bg-success d-flex align-items-center" style={{ fontSize: "1rem" }}>
                    Sort: {sortBy === "views" ? "Nhiều lượt xem" :
                           sortBy === "least_views" ? "Ít lượt xem" :
                           sortBy === "longest" ? "Video dài" :
                           sortBy === "shortest" ? "Video ngắn" :
                           sortBy === "oldest" ? "Cũ nhất" : "Mới nhất"}
                    <button type="button" className="btn-close btn-close-white ms-2" aria-label="Close" onClick={() => setSortBy("latest")}></button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Lesson cards */}
        <div className="row g-3">
          {lessons.map((lesson, idx) => {
            const isLast = idx === lessons.length - 1;
            return (
              <div key={lesson.id} ref={isLast ? lastLessonRef : null} className="col-12 col-md-6 col-lg-3">
                <div className="card h-100 shadow-sm position-relative">
                  <div className="position-relative">
                    <img src={lesson.thumbnail_url} className="card-img-top" alt={lesson.title} style={{ height: "180px", objectFit: "cover" }} />
                    <span className="badge bg-primary position-absolute top-0 end-0 m-2">{lesson.level || "B1"}</span>
                    <div className="position-absolute bottom-0 start-0 m-2 d-flex gap-2">
                      <span className="badge bg-danger">YouTube</span>
                      <span className="badge bg-dark">{lesson.durationText}</span>
                    </div>
                    <span className="badge bg-dark bg-opacity-75 position-absolute top-0 start-0 m-2">🎧 {lesson.views || 0}</span>
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
            );
          })}
        </div>

        {status === "loading" && (
          <div className="text-center mt-3">⏳ Đang tải dữ liệu...</div>
        )}
        {!lessons.length && status === "succeeded" && !loadingMore && !error && (
          <div className="text-center mt-3">Không tìm thấy bài học phù hợp.</div>
        )}
        {loadingMore && (
          <div className="text-center mt-3">⏳ Đang tải thêm...</div>
        )}
        {error && (
          <div className="text-center mt-3 text-danger">{error}</div>
        )}
      </div>
    </div>
  );
};

export default TopicDetailPage;
