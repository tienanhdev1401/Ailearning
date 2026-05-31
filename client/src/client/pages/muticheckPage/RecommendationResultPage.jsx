import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import useCurrentUser from "../../hooks/useCurrentUser";
import { useToast } from "../../../context/ToastContext";
import styles from "../../styles/RecommendationResultPage.module.css";

// ── Loading step definitions ──────────────────────────
const LOADING_STEPS = [
  { label: "Đang thu thập thông tin đánh giá...", delay: 0 },
  { label: "AelanG đang phân tích trình độ của bạn...", delay: 1500 },
  { label: "Đang so sánh với các lộ trình phù hợp...", delay: 3500 },
  { label: "Chuẩn bị kết quả đề xuất...", delay: 5500 },
];

export default function RecommendationResultPage() {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const navigate = useNavigate();
  const toast = useToast();
  const { userId, loading: userLoading } = useCurrentUser();

  // ── Animated loading steps ──────────────────────────
  useEffect(() => {
    if (!loading) return;
    const timers = LOADING_STEPS.map((step, i) =>
      setTimeout(() => setActiveStep(i), step.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [loading]);

  // ── Fetch recommendation ────────────────────────────
  const fetchRecommendation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/roadmap-recommendation");
      setRecommendation(res.data);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Không thể tải đề xuất. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userLoading && userId) {
      fetchRecommendation();
    }
  }, [userLoading, userId, fetchRecommendation]);

  // ── Enroll & start roadmap ──────────────────────────
  const handleStartRoadmap = async () => {
    if (!recommendation || !userId) return;
    setEnrolling(true);
    try {
      await api.post("/roadmap_enrollments/enroll", {
        userId,
        roadmapId: recommendation.recommendedRoadmapId,
      });

      // Xóa sessionStorage multicheck
      sessionStorage.removeItem("reason");
      sessionStorage.removeItem("goal");
      sessionStorage.removeItem("topics");
      sessionStorage.removeItem("proficiency");
      sessionStorage.removeItem("level");

      toast.success("🎉 Bạn đã bắt đầu lộ trình học tập!");
      navigate(`/roadmaps/${recommendation.recommendedRoadmapId}/days`);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Không thể đăng ký lộ trình.";
      toast.error(msg);
    } finally {
      setEnrolling(false);
    }
  };

  const handleBrowseAll = () => {
    sessionStorage.removeItem("reason");
    sessionStorage.removeItem("goal");
    sessionStorage.removeItem("topics");
    sessionStorage.removeItem("proficiency");
    sessionStorage.removeItem("level");
    navigate("/roadmaps", { state: { skipAutoRedirect: true } });
  };

  // ── Render: Loading ─────────────────────────────────
  if (loading || userLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <div className={styles.mascotWrapper}>
            <div className={styles.mascotGlow} />
            <img
              src="/assets/img/hero/hero4.png"
              alt="AelanG mascot"
              className={styles.mascotImage}
            />
          </div>
          <div className={styles.loadingText}>
            AelanG đang tìm lộ trình phù hợp cho bạn
            <span className={styles.loadingDots}>
              <span />
              <span />
              <span />
            </span>
          </div>
          <div className={styles.loadingSteps}>
            {LOADING_STEPS.map((step, i) => {
              let cls = styles.loadingStep;
              if (i < activeStep) cls += ` ${styles.done}`;
              else if (i === activeStep) cls += ` ${styles.active}`;
              return (
                <div
                  key={i}
                  className={cls}
                  style={{ animationDelay: `${step.delay}ms` }}
                >
                  <span className={styles.stepIcon}>
                    {i < activeStep ? "✓" : i === activeStep ? "⟳" : "○"}
                  </span>
                  {step.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Error ───────────────────────────────────
  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>😵</div>
          <div className={styles.errorTitle}>Không thể tải đề xuất</div>
          <div className={styles.errorMessage}>{error}</div>
          <button className={styles.btnRetry} onClick={fetchRecommendation}>
            Thử lại
          </button>
          <button className={styles.btnSecondary} onClick={handleBrowseAll}>
            Xem tất cả lộ trình
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Result ──────────────────────────────────
  const { userProfile, reason, tips } = recommendation;

  return (
    <div className={styles.page}>
      <div className={styles.resultContainer}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerBadge}>
            <span></span> ROADMAP
          </div>
          <h1 className={styles.headerTitle}>
            Lộ trình dành cho bạn
          </h1>
        </div>

        {/* User profile summary */}
        <div className={styles.profileSummary}>
          <div className={styles.profileCard}>
            <div className={styles.profileLabel}>Trình độ</div>
            <div className={styles.profileValue}>
              {userProfile?.level || "—"}
            </div>
          </div>
          <div className={styles.profileCard}>
            <div className={styles.profileLabel}>Mục tiêu</div>
            <div className={styles.profileValue}>
              {userProfile?.goal?.time || userProfile?.goal?.label || "—"}
            </div>
          </div>
          <div className={styles.profileCard}>
            <div className={styles.profileLabel}>Lý do học</div>
            <div className={styles.profileValue}>
              {userProfile?.reason || "—"}
            </div>
          </div>
          <div className={styles.profileCard}>
            <div className={styles.profileLabel}>Chủ đề</div>
            <div className={styles.profileValue}>
              {Array.isArray(userProfile?.topics)
                ? userProfile.topics.slice(0, 3).join(", ") +
                (userProfile.topics.length > 3
                  ? ` +${userProfile.topics.length - 3}`
                  : "")
                : "—"}
            </div>
          </div>
        </div>

        {/* Recommendation card */}
        <div className={styles.recommendationCard}>
          <div className={styles.recBadge}>
            <span></span> Roadmap được đề xuất
          </div>
          <h2 className={styles.recTitle}>
            {recommendation.roadmapName || "Lộ trình học tập"}
          </h2>
          {recommendation.roadmapDescription && (
            <p className={styles.recDescription}>
              {recommendation.roadmapDescription}
            </p>
          )}
          <div className={styles.recReason}>
            <div className={styles.recReasonLabel}>
              <span></span> Phân tích từ AelanG
            </div>
            {reason}
          </div>
        </div>

        {/* Tips */}
        {tips && tips.length > 0 && (
          <div className={styles.tipsSection}>
            <h3 className={styles.tipsTitle}>
              <span>💡</span> Mẹo học tập dành cho bạn
            </h3>
            <div className={styles.tipsList}>
              {tips.map((tip, i) => (
                <div key={i} className={styles.tipCard}>
                  <div className={styles.tipNumber}>{i + 1}</div>
                  <div className={styles.tipText}>{tip}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.btnPrimary}
            onClick={handleStartRoadmap}
            disabled={enrolling}
          >
            {enrolling ? "Đang đăng ký..." : " Bắt đầu lộ trình này"}
          </button>
          <button className={styles.btnSecondary} onClick={handleBrowseAll}>
            Xem tất cả lộ trình
          </button>
        </div>
      </div>
    </div>
  );
}
