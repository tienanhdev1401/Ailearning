import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from '../../styles/RoadmapPage.module.css';
import {
  createRoadmapReview,
  deleteRoadmapReview,
  fetchRoadmapReviews,
  updateRoadmapReview,
} from '../../services/roadmapReviewService';
import { useToast } from '../../../context/ToastContext';

const classNames = (...parts) => parts.filter(Boolean).join(' ');

const ratingFilterOptions = [
  { value: 'ALL', label: 'Tất cả xếp hạng' },
  { value: '5', label: '5 sao' },
  { value: '4', label: '4 sao' },
  { value: '3', label: '3 sao' },
  { value: '2', label: '2 sao' },
  { value: '1', label: '1 sao' },
];

const defaultSummary = {
  total: 0,
  average: 0,
  breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
};

const normalizeTimestamp = (value) => {
  if (!value) return new Date().toISOString();
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

const normalizeSummary = (raw) => {
  if (!raw) return defaultSummary;
  return {
    total: Number(raw.total || 0),
    average: Number(raw.average || 0),
    breakdown: {
      ...defaultSummary.breakdown,
      ...(raw.breakdown || {}),
    },
  };
};

const normalizeReview = (raw) => ({
  id: raw?.id || `review-${Math.random().toString(36).slice(2)}`,
  user: raw?.user
    ? {
        id: raw.user.id,
        name: raw.user.name || raw.user.fullName || 'Người học ẩn danh',
        avatarUrl: raw.user.avatarUrl || null,
      }
    : {
        id: raw?.userId || null,
        name: raw?.author || 'Người học ẩn danh',
        avatarUrl: raw?.avatarUrl || null,
      },
  rating: Number(raw?.rating) || 0,
  comment: raw?.comment || raw?.content || '',
  createdAt: normalizeTimestamp(raw?.createdAt || raw?.updatedAt || new Date().toISOString()),
  updatedAt: normalizeTimestamp(raw?.updatedAt || raw?.createdAt || new Date().toISOString()),
  isLocal: Boolean(raw?.isLocal),
  isOwner: Boolean(raw?.isOwner),
});

const calculateRelativeTime = (isoString) => {
  if (!isoString) {
    return 'Vừa xong';
  }
  const timestamp = new Date(isoString).getTime();
  if (Number.isNaN(timestamp)) {
    return 'Vừa xong';
  }
  const diffMs = Date.now() - timestamp;
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} tháng trước`;
  const years = Math.floor(months / 12);
  return `${years} năm trước`;
};

const RoadmapReviewPanel = ({ roadmapId, roadmapTitle, onClose }) => {
  const toast = useToast();
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(defaultSummary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [formRating, setFormRating] = useState(5);
  const [formContent, setFormContent] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [pendingActionId, setPendingActionId] = useState(null);

  const applyFallbackData = useCallback(() => {
    setReviews([]);
    setSummary(defaultSummary);
  }, []);

  const loadReviews = useCallback(async () => {
    if (!roadmapId) {
      applyFallbackData();
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetchRoadmapReviews(roadmapId);
      const normalized = Array.isArray(response?.reviews)
        ? response.reviews.map((item) => normalizeReview(item)).filter((item) => item.comment.trim().length > 0)
        : [];
      const ordered = normalized
        .slice()
        .sort((a, b) => {
          if (a.isOwner === b.isOwner) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return a.isOwner ? -1 : 1;
        });
      setSummary(normalizeSummary(response?.summary));
      setReviews(ordered);
    } catch (fetchError) {
      console.warn('Không thể tải đánh giá lộ trình', fetchError);
      setError('Hiện chưa thể tải đánh giá thực tế.');
      applyFallbackData();
    } finally {
      setLoading(false);
    }
  }, [applyFallbackData, roadmapId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const filteredReviews = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return reviews.filter((review) => {
      const matchRating = ratingFilter === 'ALL' || `${review.rating}` === ratingFilter;
      const authorName = review.user?.name || 'Người học ẩn danh';
      const matchText =
        !query ||
        review.comment.toLowerCase().includes(query) ||
        authorName.toLowerCase().includes(query);
      return matchRating && matchText;
    });
  }, [ratingFilter, reviews, searchTerm]);

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    if (!roadmapId) return;
    const sanitizedContent = formContent.trim();
    if (!sanitizedContent) {
      setError('Vui lòng chia sẻ cảm nhận trước khi gửi.');
      return;
    }
    setFormSubmitting(true);
    setError('');
    try {
      if (editingReviewId) {
        await updateRoadmapReview(roadmapId, editingReviewId, {
          rating: formRating,
          comment: sanitizedContent,
        });
      } else {
        await createRoadmapReview(roadmapId, {
          rating: formRating,
          comment: sanitizedContent,
        });
      }
      setFormContent('');
      setFormRating(5);
      setEditingReviewId(null);
      await loadReviews();
    } catch (submitError) {
      const message = submitError?.response?.data?.message || 'Không thể gửi đánh giá, vui lòng thử lại.';
      setError(message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditReview = (review) => {
    if (!review?.id) return;
    setEditingReviewId(review.id);
    setFormRating(review.rating || 5);
    setFormContent(review.comment || '');
  };

  const handleDeleteReview = async (review) => {
    if (!roadmapId || !review?.id) return;
    const confirmed = await toast.confirm('Bạn có chắc muốn xoá đánh giá này?', { type: 'danger', confirmText: 'Xóa', cancelText: 'Hủy' });
    if (!confirmed) return;
    setPendingActionId(review.id);
    setError('');
    try {
      await deleteRoadmapReview(roadmapId, review.id);
      if (editingReviewId === review.id) {
        setEditingReviewId(null);
        setFormRating(5);
        setFormContent('');
      }
      await loadReviews();
    } catch (deleteError) {
      const message = deleteError?.response?.data?.message || 'Không thể xoá đánh giá, vui lòng thử lại.';
      setError(message);
    } finally {
      setPendingActionId(null);
    }
  };

  const handleCancelAction = () => {
    if (editingReviewId) {
      setEditingReviewId(null);
      setFormRating(5);
      setFormContent('');
      return;
    }
    onClose();
  };

  const renderStars = (value) => {
    return Array.from({ length: 5 }).map((_, index) => {
      const starValue = index + 1;
      const isFilled = value >= starValue;
      const isHalf = !isFilled && value >= starValue - 0.5;
      return (
        <span
          key={starValue}
          className={classNames(
            styles.reviewStar,
            isFilled && styles.reviewStarFilled,
            isHalf && styles.reviewStarHalf
          )}
        >
          ★
        </span>
      );
    });
  };

  const renderInteractiveStars = () => {
    return Array.from({ length: 5 }).map((_, index) => {
      const starValue = index + 1;
      const isActive = formRating >= starValue;
      return (
        <button
          key={starValue}
          type="button"
          className={classNames(styles.reviewStar, styles.reviewStarInteractive, isActive && styles.reviewStarFilled)}
          onClick={() => setFormRating(starValue)}
          aria-label={`Đánh giá ${starValue} sao`}
        >
          ★
        </button>
      );
    });
  };

  return (
    <div className={styles.reviewOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.reviewPanel} onClick={(event) => event.stopPropagation()}>
        <header className={styles.reviewHeader}>
          <div>
            <p className>Phản hồi của học viên</p>
            <h3 className={styles.reviewTitle}>{roadmapTitle || 'Lộ trình'}</h3>
            <p className={styles.reviewSubtitle}>
              Đọc cảm nhận từ cộng đồng và chia sẻ trải nghiệm của bạn để giúp khóa học tốt hơn.
            </p>
          </div>
          <button className={styles.closeBtn} type="button" onClick={onClose} aria-label="Đóng đánh giá">
            ×
          </button>
        </header>

        {error && <div className={styles.reviewNotice}>{error}</div>}

        <section className={styles.reviewSummary}>
          <div className={styles.reviewScore}>
            <strong className={styles.reviewAverage}>{Number.isFinite(summary.average) ? summary.average.toFixed(1) : '0.0'}</strong>
            <div className={styles.reviewStars}>{renderStars(summary.average)}</div>
            <span className={styles.reviewCount}>{summary.total} đánh giá</span>
          </div>
          <div className={styles.reviewBreakdown}>
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = summary.breakdown[rating] || 0;
              const percentage = summary.total ? Math.round((count / summary.total) * 100) : 0;
              return (
                <div key={rating} className={styles.reviewBreakdownRow}>
                  <span className={styles.reviewBreakdownLabel}>{rating} sao</span>
                  <div className={styles.reviewBreakdownBar}>
                    <span className={styles.reviewBreakdownFill} style={{ width: `${percentage}%` }} />
                  </div>
                  <span className={styles.reviewBreakdownPercent}>{percentage}%</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className={styles.reviewControls}>
          <div className={styles.reviewSearch}>
            <input
              type="text"
              value={searchTerm}
              placeholder="Tìm kiếm đánh giá"
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <button type="button" aria-label="Tìm kiếm">
              🔍
            </button>
          </div>
          <select value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value)}>
            {ratingFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </section>

        <section className={styles.reviewList}>
          {loading && <p className={styles.reviewEmpty}>Đang tải đánh giá...</p>}
          {!loading && !filteredReviews.length && (
            <p className={styles.reviewEmpty}>Chưa có đánh giá nào khớp với bộ lọc hiện tại.</p>
          )}
          {!loading &&
            filteredReviews.map((review) => (
              <article key={review.id} className={styles.reviewItem}>
                <header className={styles.reviewMeta}>
                  <div>
                    <p className={styles.reviewAuthor}>{review.user?.name || 'Người học ẩn danh'}</p>
                    <div className={styles.reviewStars}>{renderStars(review.rating)}</div>
                  </div>
                  <div className={styles.reviewMetaActions}>
                    <span className={styles.reviewDate}>{calculateRelativeTime(review.createdAt)}</span>
                    {review.isOwner && !review.isLocal && (
                      <div className={styles.reviewOwnerActions}>
                        <button
                          type="button"
                          className={styles.reviewOwnerButton}
                          onClick={() => handleEditReview(review)}
                          disabled={pendingActionId === review.id || formSubmitting}
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          type="button"
                          className={styles.reviewOwnerButtonDanger}
                          onClick={() => handleDeleteReview(review)}
                          disabled={pendingActionId === review.id}
                        >
                          Xoá
                        </button>
                      </div>
                    )}
                  </div>
                </header>
                <p className={styles.reviewComment}>{review.comment}</p>
              </article>
            ))}
        </section>

        <section className={styles.reviewFormSection}>
          <h4 className={styles.reviewFormTitle}>
            {editingReviewId ? 'Cập nhật đánh giá của bạn' : 'Để lại đánh giá của bạn'}
          </h4>
          <form className={styles.reviewForm} onSubmit={handleSubmitReview}>
            <label className={styles.reviewFormLabel} htmlFor="roadmap-review-textarea">
              Đánh giá tổng quan
            </label>
            <div className={styles.reviewFormStars}>{renderInteractiveStars()}</div>
            <textarea
              id="roadmap-review-textarea"
              value={formContent}
              onChange={(event) => setFormContent(event.target.value)}
              placeholder="Chia sẻ điều bạn thích nhất hoặc góp ý để lộ trình tốt hơn..."
              rows={4}
            />
            <div className={styles.reviewFormActions}>
              <button type="button" onClick={handleCancelAction} className={styles.reviewFormCancel}>
                {editingReviewId ? 'Hủy chỉnh sửa' : 'Đóng'}
              </button>
              <button type="submit" className={styles.reviewFormSubmit} disabled={formSubmitting}>
                {formSubmitting ? 'Đang gửi...' : editingReviewId ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default RoadmapReviewPanel;
