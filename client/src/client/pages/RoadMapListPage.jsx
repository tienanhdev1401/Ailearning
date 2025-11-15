import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import styles from '../styles/RoadmapListPage.module.css';

const RoadmapListPage = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        const res = await api.get("/roadmaps?page=1&limit=10");
        setRoadmaps(res.data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmaps();
  }, []);

  const stats = useMemo(() => {
    if (!roadmaps.length) {
      return [
        { label: 'Tổng lộ trình', value: '—' },
        { label: 'Tổng số ngày', value: '—' },
        { label: 'Cấp độ nổi bật', value: '—' },
      ];
    }

    const totalDays = roadmaps.reduce(
      (sum, roadmap) => sum + (roadmap.days?.length || roadmap.totalDays || 0),
      0
    );
    const uniqueLevels = new Set(roadmaps.map((roadmap) => roadmap.levelName || 'Roadmap')).size;

    return [
      { label: 'Tổng lộ trình', value: roadmaps.length },
      { label: 'Tổng số ngày', value: totalDays || 'Linh hoạt' },
      { label: 'Cấp độ nổi bật', value: uniqueLevels },
    ];
  }, [roadmaps]);

  const renderMeta = (roadmap) => {
    const lessons = roadmap.days?.length || roadmap.totalDays || roadmap.lessonsCount || 0;
    const dayLabel = lessons ? `${lessons} ngày học` : 'Lộ trình linh hoạt';
    const updated = roadmap.updatedAt
      ? new Date(roadmap.updatedAt).toLocaleDateString('vi-VN')
      : 'Mới cập nhật';
    return { dayLabel, updated };
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.heroEyebrow}>Lộ trình học tập</p>
          <h1 className={styles.heroTitle}>Chọn roadmap phù hợp với mục tiêu của bạn</h1>
          <p className={styles.heroSubtitle}>
            Mỗi lộ trình được thiết kế theo phong cách “gamified learning”, giúp bạn tiến bộ từng ngày với sự
            hướng dẫn rõ ràng.
          </p>
        </div>
        <div className={styles.heroStats}>
          {stats.map((stat) => (
            <article key={stat.label} className={styles.statCard}>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.gridSection}>
        {loading ? (
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`skeleton-${index}`} className={styles.skeletonCard} />
            ))}
          </div>
        ) : roadmaps.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Chưa có lộ trình nào. Quay lại sau nhé!</p>
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {roadmaps.map((roadmap) => {
              const { dayLabel, updated } = renderMeta(roadmap);
              return (
                <button
                  key={roadmap.id}
                  type="button"
                  className={styles.card}
                  onClick={() => navigate(`/roadmaps/${roadmap.id}/days`)}
                >
                  <div className={styles.cardBody}>
                    <p className={styles.cardEyebrow}>Lộ trình</p>
                    <h2 className={styles.cardTitle}>{roadmap.levelName || 'Roadmap mới'}</h2>
                    <p className={styles.cardDescription}>
                      {roadmap.description || 'Nội dung đang được cập nhật, nhưng bạn có thể bắt đầu khám phá ngay.'}
                    </p>
                  </div>
                  <div className={styles.cardMeta}>
                    <span>{dayLabel}</span>
                    <span>{updated}</span>
                  </div>
                  <div className={styles.cardActions}>
                    <span>Khám phá</span>
                    <span aria-hidden="true">→</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default RoadmapListPage;
