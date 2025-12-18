import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/api';
import styles from '../styles/RoadmapPage.module.css';
import '../styles/roadmapTokens.css';
import RoadmapMap from '../components/roadmap/RoadmapMap';
import MiniGameRenderer from '../components/MiniGame/MiniGameRender';
import RoadmapReviewPanel from '../components/roadmap/RoadmapReviewPanel';
import useCurrentUser from '../hooks/useCurrentUser';

const classNames = (...parts) => parts.filter(Boolean).join(' ');

const deriveActivityMeta = (activities = []) => {
  const total = activities.length;
  const completedCount = activities.filter((activity) => activity?.isCompleted).length;
  const progressPercent = total ? Math.round((completedCount / total) * 100) : 0;
  const firstActionableIndex = activities.findIndex(
    (activity) => activity?.isUnlocked && !activity?.isCompleted
  );
  const initialIndex = firstActionableIndex >= 0 ? firstActionableIndex : Math.max(total - 1, 0);
  return { completedCount, progressPercent, initialIndex };
};

const decorateActivitiesWithProgress = (activities = [], progressList = []) => {
  const progressMap = new Map();
  progressList.forEach((progress) => {
    const activityId = progress?.activity?.id || progress?.activityId;
    if (activityId) {
      progressMap.set(activityId, progress);
    }
  });

  let allPreviousCompleted = true;
  const list = activities.map((activity, index) => {
    const progress = progressMap.get(activity.id);
    const isCompleted = Boolean(progress?.isCompleted);
    const isInProgress = Boolean(progress && !progress.isCompleted && progress.timeSpent > 0);
    const isUnlocked = isCompleted ? true : allPreviousCompleted;
    const status = isCompleted
      ? 'completed'
      : isUnlocked
      ? (isInProgress ? 'in_progress' : 'available')
      : 'locked';

    if (!isCompleted) {
      allPreviousCompleted = false;
    }

    return {
      ...activity,
      isCompleted,
      isInProgress,
      isUnlocked,
      status,
      progressMeta: progress || null,
      timeSpent: progress?.timeSpent || 0,
      completedAt: progress?.completedAt || null,
    };
  });

  return {
    list,
    ...deriveActivityMeta(list),
  };
};

const ActivityDrawer = ({
  day,
  activities,
  loading,
  onClose,
  onLogActivity,
  onLaunchMiniGame,
  initialIndex = 0,
  progressPercentOverride,
  completedCountOverride,
}) => {
  const [currentActivityIndex, setCurrentActivityIndex] = useState(initialIndex);
  const [stage, setStage] = useState('content');
  const [miniGames, setMiniGames] = useState([]);
  const [miniGameIndex, setMiniGameIndex] = useState(-1);
  const timerRef = useRef(Date.now());

  const logActivity = useCallback(
    async (activityId, isCompleted) => {
      if (!activityId || !onLogActivity) return;
      const timeSpent = Math.max(5, Math.round((Date.now() - timerRef.current) / 1000));
      timerRef.current = Date.now();
      try {
        await onLogActivity({
          activityId,
          dayId: day?.id || null,
          timeSpent,
          isCompleted,
        });
      } catch (error) {
        console.error('Không thể ghi hoạt động', error);
      }
    },
    [day?.id, onLogActivity]
  );

  useEffect(() => {
    if (!day) return;
    setCurrentActivityIndex(initialIndex);
    setStage('content');
    timerRef.current = Date.now();
  }, [day, activities.length, initialIndex]);

  const currentActivity = activities[currentActivityIndex] || null;
  const isLastActivity = currentActivityIndex === activities.length - 1;
  const completedActivities =
    typeof completedCountOverride === 'number'
      ? completedCountOverride
      : activities.filter((activity) => activity?.isCompleted).length;
  const progressPercent =
    typeof progressPercentOverride === 'number'
      ? progressPercentOverride
      : activities.length
      ? Math.round((completedActivities / activities.length) * 100)
      : 0;
  const nextActivityTitle = currentActivity?.title || currentActivity?.name || 'Hoạt động tiếp theo';

  const completeActivity = useCallback(async () => {
    if (!currentActivity) return;
    await logActivity(currentActivity.id, true);
    setMiniGames([]);
    setMiniGameIndex(-1);
    if (isLastActivity) {
      setStage('completed');
      return;
    }
    setCurrentActivityIndex((prev) => prev + 1);
    setStage('content');
    timerRef.current = Date.now();
  }, [currentActivity, isLastActivity, logActivity]);

  const handleMiniGameNext = useCallback(() => {
    if (miniGameIndex >= 0 && miniGameIndex < miniGames.length - 1) {
      setMiniGameIndex((prev) => prev + 1);
      return;
    }
    completeActivity();
  }, [completeActivity, miniGameIndex, miniGames.length]);

  const handleAdvance = async () => {
    if (!currentActivity || (!currentActivity.isUnlocked && !currentActivity.isCompleted)) return;
    if (stage === 'content') {
      setStage('minigame');
      timerRef.current = Date.now();
      if (onLaunchMiniGame) {
        onLaunchMiniGame({
          dayId: day?.id,
          activities,
          activityIndex: currentActivityIndex,
        });
      }
      onClose();
      return;
    }
    if (stage === 'minigame') {
      handleMiniGameNext();
    }
  };

  const handleClose = () => {
    if (stage !== 'completed' && currentActivity) {
      logActivity(currentActivity.id, false);
    }
    onClose();
  };

  const fetchMiniGames = useCallback(async () => {
    if (!currentActivity) return;
    try {
      const res = await api.get(`/activities/${currentActivity.id}/minigames`);
      const payload = Array.isArray(res.data) ? res.data : [];
      setMiniGames(payload);
      setMiniGameIndex(payload.length ? 0 : -1);
    } catch (error) {
      console.error('Không tải được mini game', error);
      setMiniGames([]);
      setMiniGameIndex(-1);
    } finally {
    }
  }, [currentActivity]);

  useEffect(() => {
    if (stage === 'minigame') {
      fetchMiniGames();
    } else {
      setMiniGames([]);
      setMiniGameIndex(-1);
    }
  }, [fetchMiniGames, stage]);

  const activityStatus = (activity, index) => {
    if (activity?.isCompleted) return 'completed';
    if (!activity?.isUnlocked) return 'locked';
    if (index === currentActivityIndex) return stage === 'minigame' ? 'playing' : 'ready';
    if (activity?.isInProgress) return 'ready';
    return 'ready';
  };

  const statusLabel = (activity, index) => {
    const status = activityStatus(activity, index);
    if (status === 'completed') return 'Đã hoàn thành';
    if (status === 'playing') return 'Đang chơi';
    if (status === 'ready') {
      if (activity?.isInProgress) return 'Đang dở';
      return 'Sẵn sàng';
    }
    return 'Khóa';
  };

  const handleSelectActivity = (index) => {
    const target = activities[index];
    if (!target) return;
    if (!target.isUnlocked && !target.isCompleted) return;
    setCurrentActivityIndex(index);
    if (index === currentActivityIndex) return;
    setStage('content');
    timerRef.current = Date.now();
  };

  return (
    <div className={styles.drawerOverlay} onClick={handleClose}>
      <div className={classNames(styles.drawer, styles.popupShell)} onClick={(e) => e.stopPropagation()}>
        <header className={styles.popupHeader}>
          <div>
            <p className={styles.popupTag}>Day {day?.dayNumber || '--'} · {activities.length} nhiệm vụ</p>
            <h3 className={styles.popupTitle}>{day?.description || '--'}</h3>
            <p className={styles.popupSubtitle}>Hoàn thành từng hoạt động, ghi điểm mini game và mở thưởng cuối ngày theo thứ tự.</p>
          </div>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Đóng popup">
            ×
          </button>
        </header>
        {loading && <p className={styles.nodeDescription}>Đang tải hoạt động...</p>}
        {!loading && activities.length === 0 && (
          <p className={styles.nodeDescription}>Ngày này chưa có hoạt động chính thức, quay lại sau nhé.</p>
        )}
        {!loading && activities.length > 0 && (
          <>
            <section className={styles.popupSummary}>
              <div className={styles.progressBadge}>{progressPercent}%</div>
              <div>
                <p className={styles.summaryText}>
                  Đã hoàn thành <strong>{completedActivities}</strong> / {activities.length} nhiệm vụ.
                </p>
                <p className={styles.summaryHint}>Tiếp theo: {nextActivityTitle}</p>
              </div>
            </section>

            <section className={styles.activityListSection}>
              <div className={styles.activityListHeader}>
                <h4 className={styles.activityListTitle}>Nhiệm vụ trong ngày</h4>
                <p className={styles.activityListHint}>Bạn có thể chọn lại nhiệm vụ đã hoàn thành để ôn lại.</p>
              </div>
              <div className={styles.activityList}>
                {activities.map((activity, index) => (
                  <button
                    key={activity.id}
                    type="button"
                    className={classNames(
                      styles.activityItem,
                      styles[`activityStatus_${activityStatus(activity, index)}`]
                    )}
                    onClick={() => handleSelectActivity(index)}
                  >
                    <div>
                      <strong>{activity.title || activity.name || `Hoạt động ${index + 1}`}</strong>
                      <p className={styles.activityListMeta}>
                        {activity.type || 'Nội dung'} · {activity.duration || '—'} phút
                      </p>
                    </div>
                    <span className={styles.activityStatusBadge} data-status={activityStatus(activity, index)}>
                      {statusLabel(activity, index)}
                    </span>
                  </button>
                ))}
              </div>
            </section>


            <div className={styles.popupActions}>
              <button className={styles.primaryBtn} type="button" onClick={handleAdvance}>
                {stage === 'content'
                  ? 'Bắt đầu ngay'
                  : stage === 'minigame'
                  ? 'Hoàn thành mini game'
                  : 'Hoàn thành ngày'}
              </button>
              <button className={styles.secondaryBtn} type="button" disabled>
                Bắt đầu lại từ đầu
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const PAGE_LIMIT = 15;

const RoadMapPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId, loading: userLoading } = useCurrentUser();
  const isAuthenticated = Boolean(userId);

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
  const [miniGameView, setMiniGameView] = useState({
    dayId: null,
    activities: [],
    activityIndex: 0,
    activity: null,
    miniGames: [],
    selectedIndex: 0,
    loading: false,
    error: null,
    startTime: Date.now(),
  });
  const [publicRoadmapCache, setPublicRoadmapCache] = useState(null);
  const [interactionNotice, setInteractionNotice] = useState('');
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [switcherLoading, setSwitcherLoading] = useState(false);
  const [switchPrompt, setSwitchPrompt] = useState(null);
  const [availableRoadmaps, setAvailableRoadmaps] = useState([]);
  const [userEnrollments, setUserEnrollments] = useState([]);
  const [switching, setSwitching] = useState(false);
  const noticeTimerRef = useRef(null);

  const hydratePublicRoadmap = useCallback(async () => {
    if (publicRoadmapCache) {
      setRoadmap(publicRoadmapCache);
      const cachedDays = publicRoadmapCache?.days || [];
      const firstCached = cachedDays.slice(0, PAGE_LIMIT);
      setDays(firstCached);
      setTotalDays(cachedDays.length);
      setCurrentPage(1);
      setHasMorePages(cachedDays.length > PAGE_LIMIT);
      return;
    }
    const roadmapRes = await api.get(`/roadmaps/${id}`);
    setRoadmap(roadmapRes.data);
    setPublicRoadmapCache(roadmapRes.data);
    const fallback = roadmapRes.data?.days || [];
    const firstPage = fallback.slice(0, PAGE_LIMIT);
    setDays(firstPage);
    setTotalDays(fallback.length);
    setCurrentPage(1);
    setHasMorePages(fallback.length > PAGE_LIMIT);
  }, [id, publicRoadmapCache]);

  const showNotice = useCallback((message) => {
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
    }
    setInteractionNotice(message);
    noticeTimerRef.current = setTimeout(() => {
      setInteractionNotice('');
    }, 4000);
  }, []);

  useEffect(() => {
    setPublicRoadmapCache(null);
  }, [id]);

  useEffect(() => () => {
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
    }
  }, []);

  const fetchEnrollmentStatus = useCallback(
    async (resolvedUserId) => {
      if (!resolvedUserId) return null;
      try {
        return await api.get(`/users/${resolvedUserId}/roadmaps/${id}/enrollment`);
      } catch (error) {
        if (error?.response?.status === 404) {
          console.warn('Không tìm thấy route enrollment mới, fallback sang route cũ.');
          return await api.get(`/roadmap_enrollments/user/${resolvedUserId}/roadmap/${id}`);
        }
        throw error;
      }
    },
    [id]
  );

  const fetchUserDayStatuses = useCallback(
    async (resolvedUserId, { page: pageToLoad = 1, append = false } = {}) => {
      if (!resolvedUserId) return;
      const daysRes = await api.get(`/users/${resolvedUserId}/roadmaps/${id}/days`, {
        params: { page: pageToLoad, limit: PAGE_LIMIT },
      });
      const payload = daysRes.data || {};
      const incoming = Array.isArray(payload.data) ? payload.data : [];
      setDays((prev) => (append ? [...prev, ...incoming] : incoming));
      const total = typeof payload.total === 'number' ? payload.total : incoming.length;
      setTotalDays(total);
      setCurrentPage(pageToLoad);
      setHasMorePages(pageToLoad * PAGE_LIMIT < total);
    },
    [id]
  );

  const refreshCurrentPageDays = useCallback(async () => {
    if (!userId) return;
    try {
      await fetchUserDayStatuses(userId, { page: currentPage, append: false });
    } catch (error) {
      console.error('Không thể làm mới tiến trình ngày học', error);
    }
  }, [currentPage, fetchUserDayStatuses, userId]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (userLoading) return;
      setLoading(true);

      if (!isAuthenticated) {
        try {
          await hydratePublicRoadmap();
        } catch (error) {
          console.error(error);
        } finally {
          if (!cancelled) {
            setEnrolled(false);
            setLoading(false);
          }
        }
        return;
      }

      try {
        const checkRes = await fetchEnrollmentStatus(userId);
        if (cancelled) return;
        if (checkRes?.data?.enrolled) {
          setEnrolled(true);
          setRoadmap(checkRes.data.roadmap_enrollement.roadmap);
          try {
            await fetchUserDayStatuses(userId, { page: 1, append: false });
          } catch (error) {
            console.error('Không thể tải tiến trình, fallback sang chế độ preview', error);
            setEnrolled(false);
            await hydratePublicRoadmap();
            showNotice('Không tải được tiến trình, đang hiển thị chế độ xem trước.');
          }
        } else {
          setEnrolled(false);
          await hydratePublicRoadmap();
        }
      } catch (error) {
        console.error(error);
        setEnrolled(false);
        await hydratePublicRoadmap();
        showNotice('Không thể xác minh đăng ký, đang hiển thị chế độ xem trước.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [
    userLoading,
    isAuthenticated,
    userId,
    hydratePublicRoadmap,
    fetchEnrollmentStatus,
    fetchUserDayStatuses,
    showNotice,
  ]);

  const handleEnroll = async ({ restart = false } = {}) => {
    if (!isAuthenticated) return;
    setEnrolling(true);
    try {
      await api.post(`/roadmap_enrollments/user/${userId}/select`, {
        roadmapId: Number(id),
        restart,
      });
      setEnrolled(true);
      const roadmapRes = await api.get(`/roadmaps/${id}`);
      setRoadmap(roadmapRes.data);
      await fetchUserDayStatuses(userId, { page: 1, append: false });
    } catch (error) {
      console.error(error);
      showNotice('Không thể kích hoạt lộ trình. Thử lại sau nhé.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleLoadMoreDays = useCallback(async () => {
    if (!hasMorePages || loadingMore || !userId) return;
    setLoadingMore(true);
    try {
      await fetchUserDayStatuses(userId, { page: currentPage + 1, append: true });
    } catch (error) {
      console.error(error);
      showNotice('Không thể tải thêm ngày học.');
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, fetchUserDayStatuses, hasMorePages, loadingMore, showNotice, userId]);

  const fetchActivitiesWithProgress = useCallback(
    async (dayId) => {
      if (!dayId || !userId) return null;
      const [activitiesRes, progressRes] = await Promise.all([
        api.get(`/days/${dayId}/activities`),
        api.get(`/users/${userId}/days/${dayId}/progress`),
      ]);
      const activitiesPayloadRaw = activitiesRes.data;
      const activitiesPayload = Array.isArray(activitiesPayloadRaw?.data)
        ? activitiesPayloadRaw.data
        : Array.isArray(activitiesPayloadRaw)
        ? activitiesPayloadRaw
        : [];
      const progressPayload = Array.isArray(progressRes.data) ? progressRes.data : [];
      return decorateActivitiesWithProgress(activitiesPayload, progressPayload);
    },
    [userId]
  );

  const refreshActivitiesForDay = useCallback(
    async (dayId, { silent = false } = {}) => {
      if (!dayId || !userId) return;
      if (!silent) setActivityLoading(true);
      try {
        const decorated = await fetchActivitiesWithProgress(dayId);
        if (decorated) {
          setActivitiesCache((prev) => ({
            ...prev,
            [dayId]: {
              ...decorated,
              lastFetched: Date.now(),
            },
          }));
        }
      } catch (error) {
        console.error(error);
        showNotice('Không thể tải danh sách hoạt động.');
      } finally {
        if (!silent) setActivityLoading(false);
      }
    },
    [fetchActivitiesWithProgress, showNotice, userId]
  );

  const handleNodeClick = useCallback(
    async (day) => {
      if (!day || !userId) return;
      if (!enrolled) {
        showNotice('Bạn cần ghi danh để mở hoạt động trong ngày.');
        return;
      }
      setSelectedDayId(day.id);
      if (activitiesCache[day.id]) return;
      await refreshActivitiesForDay(day.id);
    },
    [activitiesCache, enrolled, refreshActivitiesForDay, showNotice, userId]
  );

  const handleLogActivity = useCallback(
    async ({ activityId, dayId, timeSpent, isCompleted }) => {
      if (!activityId || !userId) return;
      try {
        await api.put(`/users/${userId}/activities/${activityId}`, {
          timeSpent,
          isCompleted,
        });
        if (dayId) {
          refreshActivitiesForDay(dayId, { silent: true });
        }
        if (isCompleted) {
          refreshCurrentPageDays();
        }
      } catch (error) {
        console.error('Không ghi được hoạt động', error);
        showNotice('Không ghi được tiến trình hoạt động.');
      }
    },
    [refreshActivitiesForDay, refreshCurrentPageDays, showNotice, userId]
  );

  const loadMiniGamesFor = useCallback((dayId, activitiesList, activityIndex) => {
    const activity = activitiesList?.[activityIndex] || null;
    setMiniGameView({
      dayId,
      activities: activitiesList,
      activityIndex,
      activity,
      miniGames: [],
      selectedIndex: 0,
      loading: true,
      error: null,
      startTime: Date.now(),
    });
    if (!activity) {
      return;
    }
    api
      .get(`/activities/${activity.id}/minigames`)
      .then((res) => {
        const payload = Array.isArray(res.data) ? res.data : [];
        setMiniGameView((prev) => ({
          ...prev,
          miniGames: payload,
          loading: false,
        }));
      })
      .catch((error) => {
        console.error('Không tải được mini game cho khu vực lớn', error);
        setMiniGameView((prev) => ({
          ...prev,
          miniGames: [],
          loading: false,
          error: 'Không tải được mini game. Thử lại sau nhé.',
        }));
      });
  }, []);

  const closeMiniGameView = useCallback(() => {
    setMiniGameView({
      dayId: null,
      activities: [],
      activityIndex: 0,
      activity: null,
      miniGames: [],
      selectedIndex: 0,
      loading: false,
      error: null,
      startTime: Date.now(),
    });
    setSelectedDayId(null);
  }, []);

  const handleLaunchMiniGame = useCallback(
    ({ dayId, activities, activityIndex }) => {
      loadMiniGamesFor(dayId, activities, activityIndex);
    },
    [loadMiniGamesFor]
  );

  const completeMiniGameActivity = useCallback(async () => {
    if (!miniGameView.activity) return;
    const timeSpent = Math.max(5, Math.round((Date.now() - miniGameView.startTime) / 1000));
    await handleLogActivity({
      activityId: miniGameView.activity.id,
      dayId: miniGameView.dayId,
      timeSpent,
      isCompleted: true,
    });
    const isLastActivity = miniGameView.activityIndex >= miniGameView.activities.length - 1;
    if (isLastActivity) {
      closeMiniGameView();
      return;
    }
    loadMiniGamesFor(miniGameView.dayId, miniGameView.activities, miniGameView.activityIndex + 1);
  }, [handleLogActivity, loadMiniGamesFor, closeMiniGameView, miniGameView]);

  const handleMiniGameViewNext = useCallback(() => {
    if (!miniGameView.miniGames.length) return;
    const isLastMiniGame = miniGameView.selectedIndex >= miniGameView.miniGames.length - 1;
    if (!isLastMiniGame) {
      setMiniGameView((prev) => ({ ...prev, selectedIndex: prev.selectedIndex + 1 }));
      return;
    }
    completeMiniGameActivity();
  }, [miniGameView, completeMiniGameActivity]);

  const selectMiniGame = useCallback((index) => {
    setMiniGameView((prev) => ({ ...prev, selectedIndex: index }));
  }, []);

  const sourceDays = useMemo(() => {
    if (enrolled) return days;
    if (days.length) return days;
    return roadmap?.days || [];
  }, [days, roadmap, enrolled]);

  const selectedDay = useMemo(() => sourceDays.find((d) => d.id === selectedDayId) || null, [selectedDayId, sourceDays]);
  const drawerRecord = selectedDayId ? activitiesCache[selectedDayId] : null;
  const drawerActivities = drawerRecord?.list || [];
  const drawerInitialIndex = drawerRecord?.initialIndex ?? 0;
  const drawerProgressPercent = drawerRecord?.progressPercent;
  const drawerCompletedCount = drawerRecord?.completedCount;

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

  const mapTitleText = useMemo(() => {
    if (!totalCount) {
      return enrolled ? 'Đang theo dõi lộ trình' : 'Khám phá lộ trình';
    }
    if (!enrolled) {
      return `Lộ trình gồm ${totalCount} ngày luyện tập`;
    }
    return `Đã hoàn thành ${completedCount}/${totalCount} ngày (${progressPercent}%)`;
  }, [completedCount, enrolled, progressPercent, totalCount]);

  const overviewHtml = useMemo(() => (roadmap?.overview ?? '').trim(), [roadmap?.overview]);
  const hasOverview = overviewHtml.length > 0;
  const openOverview = useCallback(() => {
    if (!hasOverview) {
      showNotice('Lộ trình chưa có phần giới thiệu.');
      return;
    }
    setOverviewOpen(true);
  }, [hasOverview, showNotice]);
  const closeOverview = useCallback(() => {
    setOverviewOpen(false);
  }, []);
  const openReviews = useCallback(() => {
    setReviewsOpen(true);
  }, []);
  const closeReviews = useCallback(() => {
    setReviewsOpen(false);
  }, []);

  const enrollmentMap = useMemo(() => {
    const map = new Map();
    (userEnrollments || []).forEach((enrollment) => {
      if (enrollment?.roadmap?.id) {
        map.set(enrollment.roadmap.id, enrollment);
      }
    });
    return map;
  }, [userEnrollments]);

  const loadSwitcherData = useCallback(async () => {
    if (!isAuthenticated) return;
    setSwitcherLoading(true);
    try {
      const [roadmapsRes, enrollmentsRes] = await Promise.all([
        api.get('/roadmaps?page=1&limit=50'),
        api.get(`/roadmap_enrollments/user/${userId}`),
      ]);
      setAvailableRoadmaps(Array.isArray(roadmapsRes.data?.data) ? roadmapsRes.data.data : []);
      setUserEnrollments(Array.isArray(enrollmentsRes.data) ? enrollmentsRes.data : []);
    } catch (error) {
      console.error('Không tải được danh sách lộ trình', error);
      showNotice('Không tải được danh sách lộ trình, thử lại nhé.');
    } finally {
      setSwitcherLoading(false);
    }
  }, [isAuthenticated, showNotice, userId]);

  const openSwitcher = useCallback(() => {
    if (!isAuthenticated) {
      showNotice('Đăng nhập để chọn lộ trình cá nhân.');
      return;
    }
    setSwitcherOpen(true);
    loadSwitcherData();
  }, [isAuthenticated, loadSwitcherData, showNotice]);

  const closeSwitcher = useCallback(() => {
    setSwitcherOpen(false);
    setSwitchPrompt(null);
  }, []);

  const handleSelectRoadmap = useCallback(
    async (candidate) => {
      if (!candidate) return;
      if (!userId) {
        showNotice('Bạn cần đăng nhập để chọn lộ trình.');
        return;
      }
      if (candidate.id === roadmap?.id) {
        closeSwitcher();
        return;
      }

      setSwitching(true);
      try {
        const check = await api.get(`/roadmap_enrollments/user/${userId}/roadmap/${candidate.id}`);
        const payload = check?.data || {};
        const hasEnrollment = payload?.hasEnrollment;
        const hasProgress = payload?.progressSummary?.hasProgress;
        const status = payload?.status;

        if (!hasEnrollment) {
          await api.post(`/roadmap_enrollments/user/${userId}/select`, {
            roadmapId: candidate.id,
            restart: false,
          });
          closeSwitcher();
          navigate(`/roadmaps/${candidate.id}/days`, { replace: true });
          return;
        }

        if (status === 'active') {
          closeSwitcher();
          navigate(`/roadmaps/${candidate.id}/days`, { replace: true });
          return;
        }

        if (hasProgress) {
          setSwitcherOpen(false);
          setSwitchPrompt({ roadmap: candidate, summary: payload.progressSummary });
          return;
        }

        await api.post(`/roadmap_enrollments/user/${userId}/select`, {
          roadmapId: candidate.id,
          restart: false,
        });
        closeSwitcher();
        navigate(`/roadmaps/${candidate.id}/days`, { replace: true });
      } catch (error) {
        console.error('Không đổi được lộ trình', error);
        showNotice('Không thể đổi lộ trình lúc này.');
      } finally {
        setSwitching(false);
      }
    },
    [closeSwitcher, navigate, roadmap?.id, showNotice, userId]
  );

  const confirmSwitchPrompt = useCallback(
    async (restart) => {
      if (!switchPrompt?.roadmap || !userId) return;
      setSwitching(true);
      try {
        await api.post(`/roadmap_enrollments/user/${userId}/select`, {
          roadmapId: switchPrompt.roadmap.id,
          restart,
        });
        setSwitchPrompt(null);
        closeSwitcher();
        navigate(`/roadmaps/${switchPrompt.roadmap.id}/days`, { replace: true });
      } catch (error) {
        console.error('Không đổi được lộ trình', error);
        showNotice('Không thể đổi lộ trình lúc này.');
      } finally {
        setSwitching(false);
      }
    },
    [closeSwitcher, navigate, showNotice, switchPrompt, userId]
  );

  useEffect(() => {
    if (!overviewOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeOverview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [overviewOpen, closeOverview]);

  useEffect(() => {
    if (!reviewsOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeReviews();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [reviewsOpen, closeReviews]);


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

    if (enrolled && hasMorePages) {
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

  const mapHintText = useMemo(() => {
    if (!enrolled) {
      return 'Ghi danh để theo dõi tiến trình cá nhân và mở khóa mini game mỗi ngày.';
    }
    if (!totalCount) {
      return 'Giữ nhịp học tập mỗi ngày để thấy tiến bộ rõ rệt.';
    }
    if (!nextUnlock || completedCount >= totalCount) {
      return 'Bạn đã hoàn thành toàn bộ lộ trình – hãy ôn lại hoặc chờ nội dung mới!';
    }
    const nextSummary = nextUnlock.description?.trim() || nextUnlock.theme?.trim();
    return `Ngày tiếp theo: Day ${nextUnlock.dayNumber} • ${nextSummary || 'Sẵn sàng để chinh phục'}`;
  }, [completedCount, enrolled, nextUnlock, totalCount]);

  const handleMapSelect = useCallback(
    (node) => {
      if (!node) return;
      if (node.isLoadMore) {
        handleLoadMoreDays();
        return;
      }
      if (!enrolled) {
        showNotice('Ghi danh để mở khóa hành trình học.');
        return;
      }
      const targetDay =
        sourceDays.find((day) => day.id === node.metaId) ||
        sourceDays.find((day) => (day.dayNumber || day.day) === node.day);
      if (targetDay) {
        handleNodeClick(targetDay);
      }
    },
    [enrolled, handleLoadMoreDays, handleNodeClick, showNotice, sourceDays]
  );

  
  if (loading || userLoading) return <div className="text-center mt-5">Loading...</div>;
  if (!roadmap) return <div className="text-center mt-5">Không tìm thấy roadmap</div>;

  return (
    <div className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>
              <div className={styles.headerIntro} style={{ marginTop: 20 }}>
                <h2 className={styles.headerTitle} style={{ marginTop: 0, wordBreak: 'break-word' }}>
                  {roadmap?.levelName ? `${roadmap.levelName} Roadmap` : 'Roadmap'}
                </h2>
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
              <button className={styles.ctaGhost} type="button" onClick={openOverview}>
                Giới thiệu lộ trình
              </button>
              <button className={styles.ctaSecondary} type="button" onClick={openReviews}>
                Đánh giá & bình luận
              </button>
            </div>
          </div>
          </div>
            <div style={{ flex: '0 0 auto' }}>
              {isAuthenticated && (
                <button
                  className={styles.switchButton}
                  type="button"
                  onClick={openSwitcher}
                  disabled={switching || switcherLoading}
                  aria-label="Chọn lại lộ trình"
                  title="Chọn lại lộ trình"
                >
                  ⟳ Đổi lộ trình
                </button>
              )}
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
                <p className={styles.mapLabel}>Tổng quan</p>
                <h2 className={styles.mapTitle}>{mapTitleText}</h2>
              </div>
              <span className={styles.mapHint}>{mapHintText}</span>
            </div>
            {interactionNotice && (
              <div className={styles.noticeBanner}>{interactionNotice}</div>
            )}
            {miniGameView.activity ? (
              <div className={styles.mapColumnHub}>
                <header className={styles.miniGameHubHeader}>
                  <div>
                    <p className={styles.popupTag}>Day {miniGameView.dayId ? miniGameView.dayId : '--'}</p>
                    <h3 className={styles.miniGameHubTitle}>{miniGameView.activity?.title || 'Hoạt động hàng ngày'}</h3>
                    <p className={styles.miniGameHubSubtitle}>Chuỗi mini game giúp bạn hoàn thành {miniGameView.activities?.length || 0} hoạt động.</p>
                  </div>
                  <button className={styles.closeBtn} onClick={closeMiniGameView}>
                    ←
                  </button>
                </header>
                <div className={styles.miniGameHubBanner}>
                  <div>
                    <p className={styles.bannerLabel}>Hoạt động hiện tại</p>
                    <strong className={styles.bannerTitle}>{miniGameView.activity?.skill || 'Đang tải...'}</strong>
                  </div>
                  <div className={styles.bannerMeta}>
                    <span>Đã chơi {miniGameView.activityIndex + 1} / {miniGameView.activities?.length || 0}</span>
                    <span>{miniGameView.miniGames.length} mini game</span>
                  </div>
                </div>
                <div className={styles.miniGameHubBody}> 
                  <div className={styles.miniGameHubListGroup}>
                    {miniGameView.miniGames.map((game, index) => (
                      <button
                        key={game.id || index}
                        className={classNames(
                          styles.miniGameHubItem,
                          index === miniGameView.selectedIndex && styles.miniGameHubItemActive
                        )}
                        type="button"
                        onClick={() => selectMiniGame(index)}
                      >
                        <span>{game.title || `Mini game ${index + 1}`}</span>
                        <small>{game.type?.replace('_', ' ') || 'match image'}</small>
                        <span className={styles.itemHint}>Chơi</span>
                      </button>
                    ))}
                  </div>
                  <div className={styles.miniGameHubView}>
                    {miniGameView.loading && <p className={styles.nodeDescription}>Đang kết nối tới mini game...</p>}
                    {!miniGameView.loading && miniGameView.error && (
                      <p className={styles.nodeDescription}>{miniGameView.error}</p>
                    )}
                    {!miniGameView.loading && !miniGameView.error && miniGameView.miniGames.length === 0 && (
                      <p className={styles.nodeDescription}>Mini game đang được chuẩn bị. Bạn có thể quay lại sau.</p>
                    )}
                    {!miniGameView.loading && miniGameView.miniGames.length > 0 && (
                      <MiniGameRenderer
                        game={miniGameView.miniGames[miniGameView.selectedIndex]}
                        onNext={handleMiniGameViewNext}
                      />
                    )}
                  </div>
                </div>
                <div className={styles.miniGameHubFooter}>
                  <div className={styles.footerHint}>Hoàn tất {miniGameView.activityIndex + 1} / {miniGameView.activities?.length || 0} hoạt động.</div>
                </div>
              </div>
            ) : (
              <RoadmapMap
                nodes={mapNodes}
                onSelect={handleMapSelect}
                onLoadMore={handleLoadMoreDays}
              />
            )}
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
          {switcherOpen && (
            <div className={classNames(styles.drawerOverlay, styles.centerOverlay)} onClick={closeSwitcher}>
              <div
                className={classNames(styles.popupShell, styles.switcherPopup)}
                onClick={(event) => event.stopPropagation()}
              >
                <header className={styles.overviewHeader}>
                  <div>
                    <h3 className={styles.overviewTitle}>Chọn lộ trình khác</h3>
                    <p className={styles.popupSubtitle}>Tiến trình hiện tại được giữ nguyên. Bạn có thể quay lại bất cứ lúc nào.</p>
                  </div>
                  <button className={styles.closeBtn} type="button" onClick={closeSwitcher} aria-label="Đóng chọn lộ trình">
                    ×
                  </button>
                </header>
                {switcherLoading ? (
                  <p className={styles.nodeDescription}>Đang tải danh sách lộ trình...</p>
                ) : (
                  <div className={styles.switcherList}>
                    {availableRoadmaps.map((item) => {
                      const isCurrent = item.id === roadmap?.id && enrolled;
                      const enrollmentRecord = enrollmentMap.get(item.id);
                      const statusLabel = isCurrent
                        ? 'Đang học'
                        : enrollmentRecord
                        ? 'Đã học trước'
                        : 'Mới';
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={classNames(
                            styles.switcherCard,
                            isCurrent && styles.switcherCardActive
                          )}
                          onClick={() => handleSelectRoadmap(item)}
                          disabled={switching}
                        >
                          <div className={styles.switcherCardHeader}>
                            <div>
                              <p className={styles.mapLabel}>{item.levelName || 'Lộ trình'}</p>
                              <h4 className={styles.switcherTitle}>{item.displayName || item.title || 'Roadmap'}</h4>
                            </div>
                            <span className={styles.switcherStatus}>{statusLabel}</span>
                          </div>
                          <p className={styles.switcherDescription}>
                            {item.description || 'Lộ trình học tập được thiết kế cân bằng giữa lý thuyết và thực hành.'}
                          </p>
                        </button>
                      );
                    })}
                    {!availableRoadmaps.length && (
                      <p className={styles.nodeDescription}>Chưa có lộ trình nào để lựa chọn.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          {switchPrompt && (
            <div className={classNames(styles.drawerOverlay, styles.centerOverlay)} onClick={() => setSwitchPrompt(null)}>
              <div className={classNames(styles.popupShell, styles.switchPrompt)} onClick={(event) => event.stopPropagation()}>
                <header className={styles.overviewHeader}>
                  <div>
                    <h3 className={styles.overviewTitle}>Chào mừng trở lại</h3>
                    <p className={styles.popupSubtitle}>
                      Bạn đã học tới ngày {switchPrompt.summary?.lastCompletedDay || switchPrompt.summary?.lastTouchedDay || 1} của {switchPrompt.roadmap?.displayName || switchPrompt.roadmap?.title || 'lộ trình'}. Muốn tiếp tục hay bắt đầu lại từ đầu?
                    </p>
                  </div>
                  <button className={styles.closeBtn} type="button" onClick={() => setSwitchPrompt(null)} aria-label="Đóng thông báo">
                    ×
                  </button>
                </header>
                <div className={styles.switchPromptActions}>
                  <button
                    className={styles.primaryBtn}
                    type="button"
                    onClick={() => confirmSwitchPrompt(false)}
                    disabled={switching}
                  >
                    Tiếp tục
                  </button>
                  <button
                    className={styles.secondaryBtn}
                    type="button"
                    onClick={() => confirmSwitchPrompt(true)}
                    disabled={switching}
                  >
                    Bắt đầu lại từ ngày 1
                  </button>
                </div>
              </div>
            </div>
          )}
      {overviewOpen && hasOverview && (
        <div className={styles.drawerOverlay} onClick={closeOverview}>
          <div
            className={classNames(styles.popupShell, styles.overviewPopup)}
            onClick={(event) => event.stopPropagation()}
          >
            <header className={styles.overviewHeader}>
              <div>
                <h3 className={styles.overviewTitle}>
                  {roadmap?.levelName ? `${roadmap.levelName} Roadmap` : 'Giới thiệu lộ trình'}
                </h3>
                <p className={styles.popupSubtitle}>Tổng quan về nội dung bạn sẽ học.</p>
              </div>
              <button className={styles.closeBtn} type="button" onClick={closeOverview} aria-label="Đóng tổng quan">
                ×
              </button>
            </header>
            <div className={styles.overviewContent} dangerouslySetInnerHTML={{ __html: overviewHtml }} />
          </div>
        </div>
      )}
      {reviewsOpen && (
        <RoadmapReviewPanel
          roadmapId={roadmap?.id}
          roadmapTitle={roadmap?.levelName ? `${roadmap.levelName} Roadmap` : roadmap?.title || 'Lộ trình'}
          onClose={closeReviews}
        />
      )}
      {selectedDay && (
        <ActivityDrawer
          day={selectedDay}
          activities={drawerActivities}
          loading={activityLoading}
          onClose={() => setSelectedDayId(null)}
          onLogActivity={handleLogActivity}
          onLaunchMiniGame={handleLaunchMiniGame}
          initialIndex={drawerInitialIndex}
          progressPercentOverride={drawerProgressPercent}
          completedCountOverride={drawerCompletedCount}
        />
      )}
    </div>
  );
};

export default RoadMapPage;
