import React, { useEffect, useState } from "react";
import styles from "../../styles/MiniGameTypingChallenge.module.css";

const MiniGameTypingChallenge = ({ data, onNext }) => {
  const resources = data?.resources || {};
  const prompt = data?.prompt || "Typing Challenge";
  const targetText = resources.targetText || "";
  const parsedLimit = Number(resources.timeLimitSeconds);
  const timeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.floor(parsedLimit) : null;
  const caseSensitive = Boolean(resources.caseSensitive);
  const trimmedComparison = resources.trimmedComparison !== false;

  const [inputValue, setInputValue] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  const resetState = () => {
    setInputValue("");
    setAttempts(0);
    setFeedback(null);
    setTimeLeft(timeLimit);
  };

  useEffect(() => {
    resetState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (!timeLimit || feedback?.type === "success") return undefined;
    if (timeLeft === null || timeLeft <= 0) {
      if (!feedback) {
        setFeedback({
          type: "timeout",
          message: "Hết thời gian! Thử lại nhé.",
        });
      }
      return undefined;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLimit, timeLeft, feedback]);

  const normalize = (value) => {
    let processed = typeof value === "string" ? value : value ?? "";
    if (!caseSensitive) processed = processed.toLowerCase();
    if (trimmedComparison) processed = processed.trim();
    return processed;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const formattedTarget = normalize(targetText);
    const formattedInput = normalize(inputValue);

    const success = formattedTarget && formattedTarget === formattedInput;
    setAttempts((prev) => prev + 1);
    setFeedback({
      type: success ? "success" : "error",
      message: success ? "Chính xác! Bạn đã vượt qua thử thách." : "Chưa chính xác, thử lại nhé.",
    });

    if (success) {
      setTimeLeft(null);
    }
  };

  const handleRetry = () => {
    resetState();
  };

  const disabled = feedback?.type === "success" || feedback?.type === "timeout";

  const preventCopy = (event) => {
    event.preventDefault();
  };

  const preventPaste = (event) => {
    event.preventDefault();
  };

  return (
    <div className={styles.gameContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h2 className={styles.title}>{prompt}</h2>
          <p className={styles.subtitle}>Gõ chính xác đoạn văn mục tiêu để hoàn thành thử thách.</p>
        </div>
        {timeLimit && (
          <div
            className={`${styles.timerBadge} ${
              timeLeft !== null && timeLeft <= 5 ? styles.timerLow : ""
            }`}
          >
            <span>Thời gian:</span>
            <strong>{Math.max(timeLeft || 0, 0)}s</strong>
          </div>
        )}
      </header>

      <section className={styles.challengeCard}>
        <h3 className={styles.sectionTitle}>Đoạn văn mục tiêu</h3>
        <div
          className={styles.targetText}
          onCopy={preventCopy}
          onCut={preventCopy}
          onContextMenu={preventCopy}
          onDragStart={preventCopy}
          draggable={false}
        >
          {targetText || "(Chưa có đoạn văn mục tiêu)"}
        </div>
      </section>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.inputLabel} htmlFor="typing-answer">
          Câu trả lời của bạn
        </label>
        <textarea
          id="typing-answer"
          className={styles.textInput}
          rows={4}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder="Nhập đoạn văn ở đây..."
          disabled={disabled}
          onPaste={preventPaste}
          onDrop={preventPaste}
        />
        <div className={styles.formFooter}>
          <span className={styles.attemptCounter}>Lần thử: {attempts}</span>
          <div className={styles.formActions}>
            <button type="button" className={styles.secondaryBtn} onClick={handleRetry}>
              Làm mới
            </button>
            <button type="submit" className={styles.primaryBtn} disabled={disabled || !targetText}>
              Kiểm tra
            </button>
          </div>
        </div>
      </form>

      {feedback && (
        <div
          className={`${
            feedback.type === "success"
              ? styles.feedbackSuccess
              : feedback.type === "timeout"
              ? styles.feedbackWarning
              : styles.feedbackError
          }`}
        >
          {feedback.message}
        </div>
      )}

      <footer className={styles.footer}>
        {feedback?.type === "success" ? (
          <button type="button" className={styles.primaryBtn} onClick={onNext}>
            Tiếp tục
          </button>
        ) : (
          <button type="button" className={styles.secondaryBtn} onClick={handleRetry}>
            Thử lại
          </button>
        )}
      </footer>
    </div>
  );
};

export default MiniGameTypingChallenge;
