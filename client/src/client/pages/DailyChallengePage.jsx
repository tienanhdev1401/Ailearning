import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dailyChallengeService from '../../services/dailyChallengeService';
import MiniGameRenderer from '../components/MiniGame/MiniGameRender';
import { ThemeContext } from '../../context/ThemeContext';
import styles from './DailyChallengePage.module.css';

const DailyChallengePage = () => {
  const { roadmapId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);

  const [challenge, setChallenge] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hearts, setHearts] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isFailed, setIsFailed] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    fetchChallenge();
    return () => clearInterval(timerRef.current);
  }, []);

  const fetchChallenge = async () => {
    try {
      setLoading(true);
      const data = await dailyChallengeService.generateChallenge(roadmapId);
      if (data) {
        setChallenge(data);
        setHearts(data.hearts);
        if (data.timer) {
          setTimeLeft(data.timer);
          startTimer();
        }
      } else {
        setError('Không thể tạo thử thách');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải thử thách');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFail('Hết thời gian!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleFail = (reason) => {
    setIsFailed(true);
    clearInterval(timerRef.current);
  };

  const handleNext = () => {
    if (currentIndex < challenge.games.length - 1) {
      setCurrentIndex(prev => prev + 1);
      // Reset timer for next game if exists
      if (challenge.timer) {
        setTimeLeft(challenge.timer);
        startTimer();
      }
    } else {
      completeChallenge();
    }
  };

  const completeChallenge = async () => {
    clearInterval(timerRef.current);
    try {
      const data = await dailyChallengeService.submitChallenge(roadmapId);
      if (data) {
        setIsCompleted(true);
        // Redirect to summary after a short delay or directly
        navigate(`/daily-challenge/${roadmapId}/summary`, {
          state: { streak: data.streak, level: challenge.level }
        });
      }
    } catch (err) {
      console.error('Failed to submit challenge:', err);
      // Fallback redirect anyway if it's already done
      navigate(`/roadmaps/${roadmapId}/days`);
    }
  };

  const handleMiss = () => {
    if (hearts !== null) {
      const newHearts = hearts - 1;
      setHearts(newHearts);
      if (newHearts <= 0) {
        handleFail('Bạn đã hết lượt!');
      }
    }
  };

  if (loading) return (
    <div className={`${styles.page} ${isDarkMode ? styles.dark : ''}`}>
      <div className={styles.loading}>
        <h2>Đang chuẩn bị bộ câu hỏi...</h2>
        <div className={styles.progressBarContainer}><div className={styles.progressBar} style={{ width: '100%' }}></div></div>
      </div>
    </div>
  );

  if (error) return (
    <div className={`${styles.page} ${isDarkMode ? styles.dark : ''}`}>
      <div className={styles.error}>
        <h2 className={styles.errorTitle}>Lỗi: {error}</h2>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>Quay lại</button>
      </div>
    </div>
  );

  if (isFailed) return (
    <div className={styles.failOverlay}>
      <div className={styles.failContent}>
        <h2 className={styles.failTitle}>Thất bại!</h2>
        <p>Đừng nản lòng, hãy cố gắng vào lần tới nhé.</p>
        <button className={styles.backBtn} style={{ marginTop: 20 }} onClick={() => navigate(-1)}>Quay lại</button>
      </div>
    </div>
  );

  const currentGame = challenge.games[currentIndex];
  const progressPercent = ((currentIndex) / challenge.games.length) * 100;

  return (
    <div className={`${styles.page} ${isDarkMode ? styles.dark : ''}`}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>Thử thách Level {challenge.level}</h1>
            <p>Câu hỏi {currentIndex + 1} / {challenge.games.length}</p>
          </div>

          <div className={styles.statsBar}>
            {hearts !== null && (
              <div className={styles.statItem}>
                <span className={styles.heart}>❤️</span> {hearts}
              </div>
            )}
            {timeLeft !== null && (
              <div className={`${styles.statItem} ${timeLeft < 10 ? styles.timerWarning : ''} ${timeLeft < 5 ? styles.timerCritical : ''}`}>
                <span className={styles.timer}>⏱️</span> {timeLeft}s
              </div>
            )}
          </div>
        </header>

        <div className={styles.progressBarContainer}>
          <div className={styles.progressBar} style={{ width: `${progressPercent}%` }}></div>
        </div>

        <div className={styles.gameArea}>
          <MiniGameRenderer
            game={currentGame}
            onNext={handleNext}
            onFail={handleMiss} // Giả sử MiniGameRenderer có thể báo lỗi
          />
        </div>
      </div>
    </div>
  );
};

export default DailyChallengePage;
