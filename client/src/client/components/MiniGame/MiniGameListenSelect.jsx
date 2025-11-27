import React, { useState, useRef } from "react";
import styles from "../../styles/MiniGameListenSelect.module.css";

const MiniGameListenSelect = ({ data, onNext }) => {
  const resources = data?.resources || {};
  const options = Array.isArray(resources.options) ? resources.options : [];
  const audioUrl = resources.audioUrl || "";
  const correctIndex = Number(resources.correctIndex ?? 0);

  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const audioRef = useRef(null);

  const handlePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }
    audioRef.current.play().catch(() => {});
    setPlaying(true);
  };

  const handleEnded = () => {
    setPlaying(false);
  };

  const handleSelect = (idx) => {
    if (submitted) return;
    setSelected(idx);
  };

  const handleSubmit = () => {
    if (selected === null) return;
    const ok = Number(selected) === Number(correctIndex);
    setIsCorrect(ok);
    setSubmitted(true);
  };

  const handleRetry = () => {
    setSelected(null);
    setSubmitted(false);
    setIsCorrect(false);
  };

  return (
    <div className={styles.listenContainer}>
      <header className={styles.listenHeader}>
        <div>
          <h3 className={styles.listenTitle}>{data?.prompt || "Nghe và chọn"}</h3>
          <p className={styles.listenSubtitle}>Nghe âm thanh rồi chọn đáp án đúng.</p>
        </div>
        <div className={styles.playerRow}>
          <button className={styles.playBtn} type="button" onClick={handlePlay}>
            {playing ? "Tạm dừng" : "Phát"}
          </button>
        </div>
      </header>

      <audio src={audioUrl} ref={audioRef} onEnded={handleEnded} />

      <div className={styles.optionsGrid}>
        {options.map((opt, idx) => {
          const isSel = selected === idx;
          const showCorrect = submitted && Number(idx) === Number(correctIndex);
          const showWrong = submitted && isSel && !showCorrect;
          const cls = [styles.optionCard];
          if (submitted) {
            cls.push(styles.optionDisabled);
          } else if (isSel) {
            cls.push(styles.optionSelected);
          }
          if (showCorrect) cls.push(styles.optionCorrect);
          if (showWrong) cls.push(styles.optionWrong);
          return (
            <button
              key={idx}
              type="button"
              className={cls.join(" ")}
              onClick={() => handleSelect(idx)}
              aria-pressed={isSel}
            >
              {opt.imageUrl && <img src={opt.imageUrl} alt={opt.text || ""} className={styles.optionImage} />}
              <div className={styles.optionText}>{opt.text || "—"}</div>
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <div className={styles.nextWrap}>
          <button
            className={styles.nextBtn}
            type="button"
            onClick={handleSubmit}
            disabled={selected === null}
          >
            Nộp đáp án
          </button>
        </div>
      ) : (
        <>
          <div className={isCorrect ? styles.feedback + ' ' + styles.feedbackCorrect : styles.feedback + ' ' + styles.feedbackWrong}>
            {isCorrect ? 'Chính xác! Bạn có thể tiếp tục.' : 'Sai rồi, hãy thử lại.'}
          </div>
          <div className={styles.nextWrap}>
            {!isCorrect ? (
              <button className={styles.nextBtn} type="button" onClick={handleRetry}>
                Thử lại
              </button>
            ) : (
              <button className={styles.nextBtn} type="button" onClick={onNext}>
                Tiếp tục
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MiniGameListenSelect;
