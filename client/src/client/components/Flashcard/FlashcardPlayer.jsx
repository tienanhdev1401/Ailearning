import React, { useState, useEffect, useCallback, useContext } from "react";
import { ThemeContext } from "../../../context/ThemeContext";
import { VolumeUp, Star, StarFill, Lightbulb, ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import styles from "../../styles/FlashcardPlayer.module.css";

const FlashcardPlayer = ({ cards }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [starredIndices, setStarredIndices] = useState(new Set());

  const currentCard = cards[currentIndex] || {};

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((prev) => prev + 1), 150);
    }
  }, [currentIndex, cards.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((prev) => prev - 1), 150);
    }
  }, [currentIndex]);

  const toggleStar = (e) => {
    e.stopPropagation();
    setStarredIndices((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) next.delete(currentIndex);
      else next.add(currentIndex);
      return next;
    });
  };

  const speak = (e, text) => {
    e.stopPropagation();
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      } else if (e.code === "ArrowRight") {
        handleNext();
      } else if (e.code === "ArrowLeft") {
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip, handleNext, handlePrev]);

  if (cards.length === 0) return null;

  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className={styles.playerContainer}>
      {/* Card Stage */}
      <div className={styles.cardStage} onClick={handleFlip}>
        <div className={`${styles.flashcard} ${isFlipped ? styles.isFlipped : ""}`}>
          {/* Front Side */}
          <div className={styles.cardFront}>
            <div className={styles.cardHeader}>
              <button className={styles.hintBtn} title="Gợi ý">
                <Lightbulb /> <span>Hiển thị gợi ý</span>
              </button>
              <div className={styles.topActions}>
                <button className={styles.iconBtn} onClick={(e) => speak(e, currentCard.term)}>
                  <VolumeUp size={20} />
                </button>
                <button className={styles.iconBtn} onClick={toggleStar}>
                  {starredIndices.has(currentIndex) ? <StarFill size={20} color="#f59e0b" /> : <Star size={20} />}
                </button>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.termText}>{currentCard.term}</div>
            </div>
            <div className={styles.cardFooter}>
              <span>Chạm hoặc nhấn phím Cách để lật</span>
            </div>
          </div>

          {/* Back Side */}
          <div className={styles.cardBack}>
            <div className={styles.cardHeader}>
              <div className={styles.topActions} style={{ marginLeft: "auto" }}>
                <button className={styles.iconBtn} onClick={(e) => speak(e, currentCard.definition)}>
                  <VolumeUp size={20} />
                </button>
                <button className={styles.iconBtn} onClick={toggleStar}>
                  {starredIndices.has(currentIndex) ? <StarFill size={20} color="#f59e0b" /> : <Star size={20} />}
                </button>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.definitionText}>{currentCard.definition}</div>
            </div>
            <div className={styles.cardFooter}>
              <span>Chạm hoặc nhấn phím Cách để lật lại</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls & Progress */}
      <div className={styles.playerControls}>
        <div className={styles.navButtons}>
          <button 
            className={styles.navBtn} 
            onClick={handlePrev} 
            disabled={currentIndex === 0}
          >
            <ChevronLeft size={24} />
          </button>
          <div className={styles.counter}>
            {currentIndex + 1} / {cards.length}
          </div>
          <button 
            className={styles.navBtn} 
            onClick={handleNext} 
            disabled={currentIndex === cards.length - 1}
          >
            <ChevronRight size={24} />
          </button>
        </div>
        
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardPlayer;
