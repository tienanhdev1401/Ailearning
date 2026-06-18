import React, { useState, useRef, useMemo } from "react";
import styles from "../../styles/MiniGameListenSelect.module.css";
import { shuffleArray } from "../../../utils/array";

const MiniGameListenSelect = ({ data, onNext, onFail }) => {
  const resources = data?.resources || {};
  const audioUrl = resources.audioUrl || "";
  const correctIndex = Number(resources.correctIndex ?? 0);

  // Shuffle options and keep track of original indices
  const options = useMemo(() => {
    const originalOptions = Array.isArray(resources.options) ? resources.options : [];
    const zipped = originalOptions.map((opt, idx) => ({ ...opt, originalIndex: idx }));
    return shuffleArray(zipped);
  }, [resources.options]);

  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState(null); // stores index in the SHUFFLED array
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
    const selectedOpt = options[selected];
    const ok = Number(selectedOpt.originalIndex) === Number(correctIndex);
    setIsCorrect(ok);
    setSubmitted(true);
    if (!ok && onFail) onFail();
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
          <button
            className={`${styles.playBtn} ${playing ? styles.playBtnPlaying : ""}`}
            type="button"
            onClick={handlePlay}
            aria-label={playing ? "Tạm dừng" : "Phát"}
            title={playing ? "Tạm dừng" : "Phát"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: "24px", height: "24px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
            </svg>
          </button>
        </div>
      </header>

      <audio src={audioUrl} ref={audioRef} onEnded={handleEnded} />

      <div className={styles.optionsGrid}>
        {options.map((opt, idx) => {
          const isSel = selected === idx;
          const showCorrect = submitted && Number(opt.originalIndex) === Number(correctIndex);
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
