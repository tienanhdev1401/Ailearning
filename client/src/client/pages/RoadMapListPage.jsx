import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import styles from '../styles/RoadmapListPage.module.css';
import useCurrentUser from '../hooks/useCurrentUser';

const RoadmapListPage = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [checkingActiveRoadmap, setCheckingActiveRoadmap] = useState(true);
  const { userId, loading: userLoading } = useCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        const res = await api.get('/roadmaps?page=1&limit=20');
        setRoadmaps(res.data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmaps();
  }, []);

  useEffect(() => {
    const checkActive = async () => {
      if (userLoading) return;
      if (!userId) {
        setCheckingActiveRoadmap(false);
        return;
      }

      try {
        const res = await api.get(`/roadmap_enrollments/user/${userId}/active`);
        const activeRoadmapId = res.data?.enrollment?.roadmap?.id || res.data?.roadmap_enrollement?.roadmap?.id;
        if (activeRoadmapId) {
          navigate(`/roadmaps/${activeRoadmapId}/days`, { replace: true });
          return;
        }
      } catch (error) {
        console.error('Không kiểm tra được lộ trình đang theo học', error);
      }

      setCheckingActiveRoadmap(false);
    };

    checkActive();
  }, [navigate, userId, userLoading]);

  const categories = useMemo(() => {
    const collected = roadmaps
      .map((roadmap) => roadmap.levelName?.trim())
      .filter(Boolean);
    return ['Tất cả', ...Array.from(new Set(collected))];
  }, [roadmaps]);

  const filteredRoadmaps = useMemo(() => {
    if (activeFilter === 'Tất cả') {
      return roadmaps;
    }
    return roadmaps.filter((roadmap) => roadmap.levelName?.trim() === activeFilter);
  }, [roadmaps, activeFilter]);

  const renderMeta = (roadmap) => {
    const lessons = roadmap.days?.length || roadmap.totalDays || roadmap.lessonsCount || 0;
    const dayLabel = lessons ? `${lessons} ngày` : 'Linh hoạt';
    const updated = roadmap.updatedAt
      ? new Date(roadmap.updatedAt).toLocaleDateString('vi-VN')
      : 'Mới';
    return { dayLabel, updated };
  };

  if (checkingActiveRoadmap || userLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingGate}>Đang kiểm tra lộ trình của bạn...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Chọn lộ trình phù hợp với bạn</h1>
          <p className={styles.heroSubtitle}>Mỗi lộ trình được thiết kế để giúp bạn luyện tập mỗi ngày và đạt được mục tiêu học tập của bạn.</p>
        </div>
        <div className={styles.statsContainer}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{roadmaps.length}</div>
            <div className={styles.statLabel}>Lộ trình</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{Math.floor(roadmaps.length * 2.5)}</div>
            <div className={styles.statLabel}>Bài học</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>100%</div>
            <div className={styles.statLabel}>Miễn phí</div>
          </div>
        </div>
      </section>

      <section className={styles.filterSection}>
        <h2 className={styles.filterTitle}>Lọc theo cấp độ</h2>
        <div className={styles.categories}>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`${styles.categoryTab} ${activeFilter === category ? styles.categoryTabActive : ''}`}
              onClick={() => setActiveFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.grid}>
        {loading ? (
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`skeleton-${index}`} className={styles.skeletonCard} />
            ))}
          </div>
        ) : filteredRoadmaps.length === 0 ? (
          <div className={styles.empty}>
            <p>Không có lộ trình nào. Thử lựa chọn khác nhé!</p>
          </div>
        ) : (
          filteredRoadmaps.map((roadmap) => {
            const { dayLabel } = renderMeta(roadmap);
            return (
              <button
                key={roadmap.id}
                type="button"
                className={styles.card}
                onClick={() => navigate(`/roadmaps/${roadmap.id}/days`)}
              >
                {roadmap.isNew && <span className={styles.badgeNew}>Mới</span>}
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>{roadmap.displayName || roadmap.title || 'Roadmap'}</h2>
                  <p className={styles.cardLevel}>{roadmap.levelName || 'Lộ trình'}</p>
                </div>
                <p className={styles.cardDescription}>
                  {roadmap.description || 'Lộ trình học tập được thiết kế cân bằng giữa lý thuyết và thực hành.'}
                </p>
                <div className={styles.cardFooter}>
                  <span className={styles.cardMeta}>{dayLabel}</span>
                  <span className={styles.cardArrow}>→</span>
                </div>
              </button>
            );
          })
        )}
      </section>
    </div>
  );
};

export default RoadmapListPage;
