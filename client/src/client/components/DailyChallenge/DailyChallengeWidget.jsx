import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import dailyChallengeService from '../../../services/dailyChallengeService';
import { ThemeContext } from '../../../context/ThemeContext';
import styles from './DailyChallengeWidget.module.css';

const DailyChallengeWidget = ({ roadmapId, isCompact = false, isFloating = false }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (roadmapId) {
      fetchStatus();
    }
  }, [roadmapId]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await dailyChallengeService.getStatus(roadmapId);
      if (data) {
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch challenge status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.skeleton}></div>;
  }

  if (!status) {
      return (
        <div className={`${styles.widget} ${isDarkMode ? styles.dark : ''}`}>
             <div className={styles.header}>
                <h3 className={styles.title}>Daily Challenge</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#64748b', textAlign: 'center', padding: '10px' }}>
                Hãy ghi danh vào lộ trình này để bắt đầu tham gia thử thách hàng ngày nhé!
            </p>
        </div>
      );
  }

    const { progress, isEligible, streak, isCompletedToday, unlockRequirement } = status;

  if (isCompact) {
    return (
      <div className={`${styles.compactWidget} ${isDarkMode ? styles.dark : ''}`} onClick={() => !isCompletedToday && isEligible && navigate(`/daily-challenge/${roadmapId}`)}>
        <div className={styles.compactHeader}>
          <div className={styles.compactStreak}>
             <span className={styles.streakIcon}>🔥</span>
             <span className={styles.streakCount}>{streak}</span>
          </div>
          <div className={styles.compactInfo}>
            <span className={styles.compactTitle}>Daily Challenge</span>
            {!isEligible ? (
                <span className={styles.compactStatus}>Locked {progress}%</span>
            ) : isCompletedToday ? (
                <span className={styles.compactStatus}>Completed</span>
            ) : (
                <span className={styles.compactStatusAction}>Play Now 🚀</span>
            )}
          </div>
        </div>
        {isEligible && !isCompletedToday && (
            <div className={styles.compactProgressBar}>
                <div className={styles.compactProgressFill} style={{ width: `${progress}%` }}></div>
            </div>
        )}
      </div>
    );
  }

  const widgetContent = (
    <div className={`${styles.widget} ${isDarkMode ? styles.dark : ''}`}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h3 className={styles.title}>Daily Challenge</h3>
          <p className={styles.subtitle}>Thử thách hàng ngày</p>
        </div>
        <div className={styles.streakBadge}>
          <span className={styles.streakIcon}>🔥</span>
          <span className={styles.streakCount}>{streak}</span>
        </div>
      </div>

      {!isEligible ? (
        <div className={styles.lockedArea}>
          <div className={styles.progressInfo}>
            <span>Tiến độ mở khóa</span>
            <span>{progress}% / {unlockRequirement}%</span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${(progress / unlockRequirement) * 100}%` }}
            ></div>
          </div>
          <p className={styles.lockMessage}>
            Khóa: Bạn cần hoàn thành {unlockRequirement}% Roadmap để mở khóa thử thách.
          </p>
        </div>
      ) : (
        <div className={styles.activeArea}>
          {isCompletedToday ? (
            <div className={styles.completedState}>
              <div className={styles.checkDone}>✅</div>
              <p>Bạn đã hoàn thành thử thách hôm nay!</p>
              <button 
                className={styles.disabledBtn}
                disabled
              >
                Đã hoàn thành
              </button>
            </div>
          ) : (
            <div className={styles.readyState}>
              <p className={styles.readyText}>
                Thử thách hôm nay đã sẵn sàng. Hãy bắt đầu ngay!
              </p>
              <button 
                className={styles.startBtn}
                onClick={() => navigate(`/daily-challenge/${roadmapId}`)}
              >
                Bắt đầu ngay 🚀
              </button>
            </div>
          )}
        </div>
      )}

      <div className={styles.decoration}></div>
    </div>
  );

  if (isFloating) {
    return (
      <div className={styles.floatingWrapper}>
        {widgetContent}
      </div>
    );
  }

  return widgetContent;
};

export default DailyChallengeWidget;
