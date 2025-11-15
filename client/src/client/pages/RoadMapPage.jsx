import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/api';
import styles from '../styles/RoadmapPage.module.css';
import '../styles/roadmapTokens.css';
import RoadmapMap from '../components/roadmap/RoadmapMap';

const classNames = (...parts) => parts.filter(Boolean).join(' ');

const ActivityDrawer = ({ day, activities, loading, onClose }) => {
  if (!day) return null;

  return (
    <div className={styles.drawerOverlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <header className={styles.drawerHeader}>
          <h3 className={styles.drawerTitle}>Day {day.dayNumber} · Activities</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="close drawer">
            ×
          </button>
        </header>
        {loading && <p className={styles.nodeDescription}>Đang tải hoạt động...</p>}
        {!loading && (
          <div className={styles.activityList}>
            {activities.length === 0 && <p className={styles.nodeDescription}>Ngày này chưa có hoạt động.</p>}
            {activities.map((activity) => (
              <article key={activity.id} className={styles.activityCard}>
                <h4 className={styles.nodeTitle}>{activity.name || activity.title}</h4>
                {activity.description && <p className={styles.nodeDescription}>{activity.description}</p>}
                <div className={styles.activityMeta}>
                  {activity.type && <span>Loại: {activity.type}</span>}
                  {activity.duration && <span>⏱ {activity.duration} phút</span>}
                  {activity.xp && <span>⚡ {activity.xp} XP</span>}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PAGE_LIMIT = 15;

const RoadMapPage = () => {
  const { id } = useParams(); // roadmapId
  const userId = 1; // TODO: thay bằng userId thực tế từ auth
  const [roadmap, setRoadmap] = useState(null);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState(null);
  const [activitiesCache, setActivitiesCache] = useState({});
  const [activityLoading, setActivityLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalDays, setTotalDays] = useState(0);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchEnrollmentStatus = useCallback(async () => {
    try {
      return await api.get(`/users/${userId}/roadmaps/${id}/enrollment`);
    } catch (error) {
      if (error?.response?.status === 404) {
        console.warn('Không tìm thấy route enrollment mới, fallback sang route cũ.');
        return await api.get(`/roadmap_enrollments/user/${userId}/roadmap/${id}`);
      }
      throw error;
    }
  }, [id, userId]);

  const fetchUserDayStatuses = useCallback(
    async ({ page: pageToLoad = 1, append = false, fallbackDays = [] } = {}) => {
      try {
        const daysRes = await api.get(`/users/${userId}/roadmaps/${id}/days`, {
          params: { page: pageToLoad, limit: PAGE_LIMIT },
        });
        const payload = daysRes.data || {};
        const incoming = Array.isArray(payload.data) ? payload.data : [];
        setDays((prev) => (append ? [...prev, ...incoming] : incoming));
        const total = typeof payload.total === 'number' ? payload.total : incoming.length;
        setTotalDays(total);
        setCurrentPage(pageToLoad);
        setHasMorePages(pageToLoad * PAGE_LIMIT < total);
      } catch (dayError) {
        const status = dayError?.response?.status;
        if (status === 404 || status === 403) {
          console.warn('Không tìm thấy tiến trình hoặc chưa có quyền, fallback sang dữ liệu sẵn có.');
          setDays(fallbackDays);
          setTotalDays(fallbackDays.length);
          setCurrentPage(1);
          setHasMorePages(false);
        } else {
          throw dayError;
        }
      }
    },
    [id, userId]
  );

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const checkRes = await fetchEnrollmentStatus();
        if (checkRes.data.enrolled) {
          setEnrolled(true);
          setRoadmap(checkRes.data.roadmap_enrollement.roadmap);
          await fetchUserDayStatuses({
            page: 1,
            append: false,
            fallbackDays: checkRes.data.roadmap_enrollement?.roadmap?.days || [],
          });
        } else {
          const roadmapRes = await api.get(`/roadmaps/${id}`);
          setRoadmap(roadmapRes.data);
          const fallback = roadmapRes.data.days || [];
          setDays(fallback);
          setTotalDays(fallback.length);
          setCurrentPage(1);
          setHasMorePages(false);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [fetchEnrollmentStatus, fetchUserDayStatuses, id]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await api.post(`/roadmap_enrollments/enroll`, {
        userId,
        roadmapId: Number(id),
      });
      setEnrolled(true);
      setDays([]);
      setCurrentPage(1);
      setHasMorePages(false);
      setTotalDays(0);
      await fetchUserDayStatuses({ page: 1, append: false, fallbackDays: roadmap?.days || [] });
    } catch (error) {
      console.error(error);
    } finally {
      setEnrolling(false);
    }
  };

  const handleLoadMoreDays = useCallback(async () => {
    if (!hasMorePages || loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchUserDayStatuses({ page: currentPage + 1, append: true });
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, fetchUserDayStatuses, hasMorePages, loadingMore]);

  const handleNodeClick = useCallback(
    async (day) => {
      if (!enrolled || !day) return;
      setSelectedDayId(day.id);
      if (activitiesCache[day.id]) return;
      try {
        setActivityLoading(true);
        const res = await api.get(`/days/${day.id}/activities`);
        setActivitiesCache((prev) => ({ ...prev, [day.id]: res.data?.data || [] }));
      } catch (error) {
        console.error(error);
      } finally {
        setActivityLoading(false);
      }
    },
    [activitiesCache, enrolled]
  );

  const selectedDay = useMemo(() => days.find((d) => d.id === selectedDayId) || null, [days, selectedDayId]);
  const drawerActivities = selectedDayId ? activitiesCache[selectedDayId] || [] : [];

  const sourceDays = useMemo(() => (days.length ? days : roadmap?.days || []), [days, roadmap]);

  const { totalCount, completedCount, inProgressCount } = useMemo(() => {
    const total = totalDays || sourceDays.length;
    let completed = 0;
    let inProgress = 0;
    sourceDays.forEach((day) => {
      if (day.status === 'completed') completed += 1;
      else if (day.status === 'in_progress') inProgress += 1;
    });
    return { totalCount: total, completedCount: completed, inProgressCount: inProgress };
  }, [sourceDays, totalDays]);

  const stats = useMemo(
    () => [
      { label: 'Tổng ngày', value: totalCount },
      { label: 'Hoàn thành', value: completedCount },
      { label: 'Đang học', value: inProgressCount },
    ],
    [completedCount, inProgressCount, totalCount]
  );

  const progressPercent = useMemo(() => {
    if (!totalCount) return 0;
    return Math.round((completedCount / totalCount) * 100);
  }, [completedCount, totalCount]);

  const mapNodes = useMemo(() => {
    if (!sourceDays.length) return [];
    const previewMode = !enrolled;
    const normalized = sourceDays.map((day, index) => {
      const position = day.dayNumber || index + 1;
      let normalizedStatus;
      if (previewMode) {
        normalizedStatus = index === 0 ? 'available' : 'locked';
      } else if (day.status === 'completed') {
        normalizedStatus = 'completed';
      } else if (day.status === 'in_progress') {
        normalizedStatus = 'available';
      } else {
        const prevUnlocked = index === 0 || sourceDays[index - 1]?.status === 'completed';
        normalizedStatus = prevUnlocked ? 'available' : 'locked';
      }
      return {
        day: position,
        metaId: day.id,
        title: day.title || day.name || day.description || `Day ${position}`,
        status: normalizedStatus,
      };
    });

    if (hasMorePages) {
      normalized.push({
        day: normalized.length + 1,
        title: 'Tải thêm',
        status: 'available',
        isLoadMore: true,
        loadingMore,
      });
    }

    return normalized;
  }, [enrolled, hasMorePages, loadingMore, sourceDays]);

  const nextUnlock = useMemo(() => {
    if (!sourceDays.length) return null;
    if (!enrolled) return sourceDays[0];
    return sourceDays.find((day) => day.status !== 'completed') || sourceDays[sourceDays.length - 1];
  }, [enrolled, sourceDays]);

  const handleMapSelect = useCallback(
    (node) => {
      if (!node) return;
      if (node.isLoadMore) {
        handleLoadMoreDays();
        return;
      }
      if (!enrolled) return;
      const targetDay =
        days.find((day) => day.id === node.metaId) ||
        days.find((day) => (day.dayNumber || day.day) === node.day);
      if (targetDay) {
        handleNodeClick(targetDay);
      }
    },
    [days, enrolled, handleLoadMoreDays, handleNodeClick]
  );

  
  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (!roadmap) return <div className="text-center mt-5">Không tìm thấy roadmap</div>;

  return (
    <div className={styles.page}>
      <div className={classNames(styles.assetPlaceholder, styles.assetFloating, styles.assetA)}>A</div>
      <div className={classNames(styles.assetPlaceholder, styles.assetFloating, styles.assetB)}>B</div>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerIntro}>
            <h1 className={styles.headerTitle}>{roadmap.levelName + ' Roadmap' || 'Roadmap'}</h1>
            <p className={styles.headerDescription}>{roadmap.description || ''}</p>
            <div className={styles.ctaRow}>
              {!enrolled && (
                <button className={styles.ctaPrimary} onClick={handleEnroll} disabled={enrolling}>
                  {enrolling ? 'Đang ghi danh...' : 'Bắt đầu ngay'}
                </button>
              )}
              {enrolled && (
                <button className={styles.ctaPrimary} type="button">
                  Tiếp tục học
                </button>
              )}
              <button className={styles.ctaGhost} type="button">
                Xem bảng thưởng
              </button>
            </div>
          </div>
          <div className={styles.statGrid}>
            {stats.map((stat) => (
              <article key={stat.label} className={styles.statCard}>
                <span className={styles.statLabel}>{stat.label}</span>
                <strong className={styles.statValue}>{stat.value}</strong>
              </article>
            ))}
          </div>
        </header>

        <section className={styles.mapStage}>
          <div className={styles.mapColumn}>
            <div className={styles.mapHeading}>
              <div>
                <p className={styles.mapLabel}>sẽ để gì đó ở đây</p>
                <h2 className={styles.mapTitle}>sẽ để gì đó ở đây</h2>
              </div>
              <span className={styles.mapHint}>sẽ để gì đó ở đây như thành tiến trình hay gì đó</span>
            </div>
            <RoadmapMap
              nodes={mapNodes}
              onSelect={handleMapSelect}
              onLoadMore={handleLoadMoreDays}
            />
          </div>
          <aside className={styles.sidePanel}>
            <article className={classNames(styles.panelCard, styles.rewardCard)}>
              <span className={styles.assetBadge}>C</span>
              <p className={styles.panelEyebrow}>Phần thưởng sắp tới</p>
              <h3 className={styles.panelTitle}>Day {nextUnlock?.dayNumber || '--'}</h3>
              <p className={styles.panelHint}>
                Đặt ảnh reward (asset C) để minh họa phần thưởng khi hoàn thành mốc này.
              </p>
            </article>
            <article className={styles.panelCard}>
              <span className={styles.panelEyebrow}>Tiến độ</span>
              <div className={styles.progressSummary}>
                <span className={styles.progressValue}>{progressPercent}%</span>
                <span className={styles.progressLabel}>Hoàn thành</span>
              </div>
              <p className={styles.panelHint}>
                Có thể đặt asset "D" ở đây (ví dụ energizer, nhân vật) để tăng độ sống động.
              </p>
            </article>
          </aside>
        </section>
      </section>
      <ActivityDrawer
        day={selectedDay}
        activities={drawerActivities}
        loading={activityLoading}
        onClose={() => setSelectedDayId(null)}
      />
    </div>
  );
};

export default RoadMapPage;
