import React, { useMemo, useState } from "react";
import styles from "../../styles/MiniGameTrueFalse.module.css";

const normalizeOptions = (options) => {
  if (!Array.isArray(options) || options.length < 2) {
    return [
      { key: "A", label: "Đúng" },
      { key: "B", label: "Sai" },
    ];
  }

  return options.slice(0, 2).map((opt, idx) => ({
    key: (opt?.key ?? (idx === 0 ? "A" : "B")).toString().toUpperCase(),
    label: opt?.label ?? (idx === 0 ? "Đúng" : "Sai"),
  }));
};

const MiniGameTrueFalse = ({ data, onNext }) => {
  const resources = data?.resources || {};
  const prompt = data?.prompt || "Chọn đáp án đúng";
  const statement = resources.statement || prompt;
  const explanation = resources.explanation || "";
  const correctOption = (resources.correctOption || "A").toString().toUpperCase();

  const options = useMemo(() => normalizeOptions(resources.options), [resources.options]);

  const [selectedKey, setSelectedKey] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSelect = (key) => {
    if (submitted) return;
    const normalized = key.toString().toUpperCase();
    setSelectedKey(normalized);
    const ok = normalized === correctOption;
    setIsCorrect(ok);
    setSubmitted(true);
  };

  const handleRetry = () => {
    setSelectedKey(null);
    setSubmitted(false);
    setIsCorrect(false);
  };

  return (
    <div className={styles.gameContainer}>
      <header className={styles.header}>
        <h2 className={styles.title}>{prompt}</h2>
        <p className={styles.subtitle}>Đọc nhận định và chọn đáp án chính xác.</p>
      </header>

      <section className={styles.statementCard}>
        <p className={styles.statementText}>{statement}</p>
      </section>

      <section className={styles.optionsSection}>
        <div className={styles.optionsGrid}>
          {options.map((option) => {
            const isActive = selectedKey === option.key;
            const isTheCorrect = submitted && option.key === correctOption;
            const isWrongChoice = submitted && isActive && !isCorrect;

            const classNames = [styles.optionButton];
            if (!submitted && isActive) classNames.push(styles.optionActive);
            if (submitted) classNames.push(styles.optionDisabled);
            if (isTheCorrect) classNames.push(styles.optionCorrect);
            if (isWrongChoice) classNames.push(styles.optionWrong);

            return (
              <button
                key={option.key}
                type="button"
                className={classNames.join(" ")}
                onClick={() => handleSelect(option.key)}
                disabled={submitted}
              >
                <span className={styles.optionKey}>{option.key}</span>
                <span className={styles.optionLabel}>{option.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <footer className={styles.footer}>
        {submitted && (
          <div className={isCorrect ? styles.feedbackSuccess : styles.feedbackError}>
            {isCorrect ? "🎉 Chính xác!" : "❌ Chưa đúng rồi, thử lại nhé."}
          </div>
        )}

        {submitted && !isCorrect && explanation && (
          <div className={styles.explanationBox}>
            <strong>Giải thích:&nbsp;</strong>
            <span>{explanation}</span>
          </div>
        )}

        {submitted && (
          <div className={styles.actionsRow}>
            {isCorrect ? (
              <button type="button" className={styles.primaryBtn} onClick={onNext}>
                Tiếp tục
              </button>
            ) : (
              <button type="button" className={styles.secondaryBtn} onClick={handleRetry}>
                Thử lại
              </button>
            )}
          </div>
        )}
      </footer>
    </div>
  );
};

export default MiniGameTrueFalse;
