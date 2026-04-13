import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import styles from '../styles/ChallengeSummary.module.css';

const ChallengeSummary = () => {
  const { roadmapId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);

  const { streak, level } = location.state || { streak: 0, level: 1 };
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Thêm một chút delay để tạo hiệu ứng xuất hiện ấn tượng
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`${styles.page} ${isDarkMode ? styles.dark : ''}`}>
      <div className={`${styles.summaryCard} ${showContent ? styles.show : ''}`}>
        <div className={styles.iconWrapper}>
          <div className={styles.crown}>👑</div>
          <div className={styles.stars}>✨✨✨</div>
        </div>

        <h1 className={styles.title}>Tuyệt vời!</h1>
        <p className={styles.subtitle}>Bạn đã vượt qua thử thách cấp độ {level}</p>

        <div className={styles.streakSection}>
          <div className={styles.streakLabel}>Chuỗi ngày hiện tại</div>
          <div className={styles.streakValue}>
            <span className={styles.fire}>🔥</span>
            <span className={styles.number}>{streak}</span>
          </div>
          <p className={styles.encourageText}>
            Hãy giữ vững phong độ này nhé! Bạn đang làm rất tốt.
          </p>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.primaryBtn}
            onClick={() => navigate(`/roadmaps/${roadmapId}/days`)}
          >
            Quay lại lộ trình 🎯
          </button>
        </div>
      </div>

      {/* Background decorations */}
      <div className={styles.blob1}></div>
      <div className={styles.blob2}></div>
    </div>
  );
};

export default ChallengeSummary;
