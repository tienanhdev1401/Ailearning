import React, { useMemo, useState } from "react";
import styles from "../../styles/MiniGameSentenceBuilder.module.css";

const shuffleArray = (arr) => {
  const cloned = [...arr];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
};

const MiniGameSentenceBuilder = ({ data, onNext }) => {
  const tokens = useMemo(() => {
    const baseTokens = Array.isArray(data?.resources?.tokens)
      ? data.resources.tokens
      : String(data?.resources?.sentence || "")
          .split(" ")
          .filter(Boolean)
          .map((word, idx) => ({ id: idx + 1, text: word }));

    return baseTokens.map((t, index) => ({
      id: t.id ?? index + 1,
      text: t.text ?? t.word ?? String(t),
    }));
  }, [data]);

  const correctSentence = tokens.map((t) => t.text).join(" ");
  const [pool, setPool] = useState(() => shuffleArray(tokens));
  const [slots, setSlots] = useState([]);
  const [isCorrect, setIsCorrect] = useState(null);

  const handleAddToken = (token) => {
    if (slots.some((s) => s.id === token.id)) return;
    setPool((prev) => prev.filter((t) => t.id !== token.id));
    setSlots((prev) => [...prev, token]);
    setIsCorrect(null);
  };

  const handleRemoveToken = (token) => {
    setSlots((prev) => prev.filter((t) => t.id !== token.id));
    setPool((prev) => [...prev, token]);
    setIsCorrect(null);
  };

  const handleCheck = () => {
    if (!slots.length) return;
    const built = slots.map((t) => t.text).join(" ");
    setIsCorrect(built.trim() === correctSentence.trim());
  };

  const handleReset = () => {
    setPool(shuffleArray(tokens));
    setSlots([]);
    setIsCorrect(null);
  };

  const allPlaced = pool.length === 0 && slots.length === tokens.length;
  const canAdvance = isCorrect === true && allPlaced;

  return (
    <div className={styles.gameContainer}>
      <header className={styles.header}>
        <h2 className={styles.title}>{data.prompt || "Sắp xếp câu đúng"}</h2>
        <p className={styles.subtitle}>Kéo các từ ở trên xuống để tạo thành câu hoàn chỉnh.</p>
      </header>

      <section className={styles.poolSection}>
        <p className={styles.sectionLabel}>Từ/ cụm từ để sắp xếp</p>
        <div className={styles.poolRow}>
          {pool.map((token) => (
            <button
              key={token.id}
              type="button"
              className={styles.tokenChip}
              onClick={() => handleAddToken(token)}
            >
              {token.text}
            </button>
          ))}
          {!pool.length && <span className={styles.poolEmpty}>Đã dùng hết từ.</span>}
        </div>
      </section>

      <section className={styles.slotsSection}>
        <p className={styles.sectionLabel}>Câu của bạn</p>
        <div className={styles.slotsRow}>
          {slots.map((token) => (
            <button
              key={token.id}
              type="button"
              className={styles.slotChip}
              onClick={() => handleRemoveToken(token)}
            >
              {token.text}
            </button>
          ))}
          {!slots.length && <span className={styles.slotsPlaceholder}>Nhấn vào từ ở trên để thêm vào câu.</span>}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryBtn} onClick={handleReset}>
            Làm lại
          </button>
          <button type="button" className={styles.primaryBtn} onClick={handleCheck}>
            Kiểm tra
          </button>
        </div>

        {isCorrect === true && (
          <p className={styles.feedbackSuccess}>🎉 Chính xác! Câu của bạn đã đúng.</p>
        )}
        {isCorrect === false && (
          <p className={styles.feedbackError}>❌ Chưa đúng lắm, thử đổi lại thứ tự nhé.</p>
        )}

        {canAdvance && (
          <div className={styles.nextWrapper}>
            <button type="button" className={styles.nextBtn} onClick={onNext}>
              Tiếp theo 🎯
            </button>
          </div>
        )}
      </footer>
    </div>
  );
};

export default MiniGameSentenceBuilder;
