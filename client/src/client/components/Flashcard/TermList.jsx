import React, { useContext } from "react";
import { ThemeContext } from "../../../context/ThemeContext";
import { VolumeUp, Star, StarFill } from "react-bootstrap-icons";
import styles from "../../styles/TermList.module.css";

const TermList = ({ cards }) => {
  const { isDarkMode } = useContext(ThemeContext);

  const speak = (text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={styles.listContainer}>
      <div className={styles.listHeader}>
        <h2 className={styles.listTitle}>Thuật ngữ trong học phần này ({cards.length})</h2>
      </div>

      <div className={styles.termsGrid}>
        {cards.map((card, index) => (
          <div key={index} className={styles.termRow}>
            <div className={styles.termContent}>
              <div className={styles.termLeft}>
                <div className={styles.termText}>{card.term}</div>
              </div>
              <div className={styles.divider}></div>
              <div className={styles.termRight}>
                <div className={styles.definitionText}>{card.definition}</div>
              </div>
            </div>
            
            <div className={styles.rowActions}>
              <button className={styles.actionBtn} onClick={() => speak(card.term)} title="Phát âm">
                <VolumeUp size={20} />
              </button>
              <button className={styles.actionBtn} title="Đánh dấu">
                <Star size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TermList;
