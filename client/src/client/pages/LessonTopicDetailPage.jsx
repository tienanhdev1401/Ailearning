import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import lessonTopicEnum from "../../enums/lessonTopic.enum";
import {
  fetchLessons,
  resetTopicState,
  selectLessons,
} from "../../features/lessons/lessonsSlice";
import DictationShadowingPopUpModal from "../components/DictationShadowingPopUpModal";

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
    (Object.entries(lessonTopicEnum).find(([key]) => key === slug) || [])[1] ||
    slug;

  const [sortBy, setSortBy] = useState("latest");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("All");
  const lastLessonRef = useRef(null);
  const [selectedLesson, setSelectedLesson] = useState(null);

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
    if (!topicKey || !topicName) return;

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
    if (!hasMore || loadingMore || status === "loading") return;

    const target = lastLessonRef.current;
    if (!target) return;

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
    <div className="bg-body text-body min-vh-100 px-4 py-4">
      <div className="container py-4" style={{ maxWidth: "1350px" }}>
        
        {/* Back */}
        <div className="mb-3">
          <button
            className="btn btn-link p-0"
            onClick={() => navigate("/topics")}
            style={{ fontSize: "18px", fontWeight: 500 }}
          >
            ← Quay lại tất cả chủ đề
          </button>
        </div>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-semibold">{topicName}</h2>
          <div className="text-muted fs-5">
            Tổng số bài học: {lessons.length}
          </div>
        </div>

        {/* Filter Card */}
        <div className="p-3 mb-4 rounded-4 border bg-body-secondary bg-opacity-25">
          <div className="d-flex align-items-center mb-3 fw-semibold fs-5">
            <span className="me-2">⚙️</span> Bộ lọc
          </div>

          <div className="d-flex gap-4 flex-wrap align-items-center">
            {/* Search */}
            <div className="position-relative" style={{ width: "700px" }}>
              <input
                type="text"
                placeholder="Tìm kiếm bài học..."
                className="form-control ps-4"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted">
                🔍
              </span>
            </div>

            {/* Level */}
            <select
              className="form-select"
              style={{ width: "300px" }}
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              {LEVELS.map((lvl) => (
                <option key={lvl.value} value={lvl.value}>
                  {lvl.label}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              className="form-select"
              style={{ width: "200px" }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
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

        {/* Lessons */}
        <div className="row g-3">
          {lessons.map((lesson, idx) => {
            const isLast = idx === lessons.length - 1;

            return (
              <div key={lesson.id} className="col-12 col-md-6 col-lg-3" ref={isLast ? lastLessonRef : null}>
                <div
                  className="card h-100 shadow-sm position-relative"
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
                      {lesson.level || "B1"}
                    </span>

                    <div className="position-absolute bottom-0 start-0 m-2 d-flex gap-2">
                      <span className="badge bg-danger">YouTube</span>
                      <span className="badge bg-dark">{lesson.durationText}</span>
                    </div>

                    <span className="badge bg-dark bg-opacity-75 position-absolute top-0 start-0 m-2">
                      🎧 {lesson.views || 0}
                    </span>
                  </div>

                  <div className="card-body d-flex flex-column">
                    <h6 className="fw-semibold mb-2">{lesson.title}</h6>

                    <div className="mt-auto d-flex gap-3 flex-wrap">
                      <span className="badge rounded-pill bg-body-secondary text-body">
                        Dictation
                      </span>

                      <span className="badge rounded-pill bg-body-secondary text-body">
                        Shadowing
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status */}
        {status === "loading" && (
          <div className="text-center mt-3">⏳ Đang tải dữ liệu...</div>
        )}
        {!lessons.length && status === "succeeded" && !loadingMore && !error && (
          <div className="text-center mt-3">Không tìm thấy bài học phù hợp.</div>
        )}
        {loadingMore && <div className="text-center mt-3">⏳ Đang tải thêm...</div>}
        {error && <div className="text-center mt-3 text-danger">{error}</div>}
      </div>
      <DictationShadowingPopUpModal
        lesson={selectedLesson}
        onClose={() => setSelectedLesson(null)}
      />
    </div>
  );
};

export default TopicDetailPage;
