import React, { useState, useEffect, useCallback, useContext } from "react";
import { ThemeContext } from "../../../context/ThemeContext";
import { VolumeUp, Star, StarFill, Lightbulb, ChevronLeft, ChevronRight, Shuffle } from "react-bootstrap-icons";
import styles from "../../styles/FlashcardPlayer.module.css";
import { speak as ttsSpeak } from "../../../utils/tts";
import SaveToNotebookModal from "./SaveToNotebookModal";
import { shuffleArray } from "../../../utils/array";

const FlashcardPlayer = ({ cards }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [shuffledCards, setShuffledCards] = useState(cards);
  const [isShuffled, setIsShuffled] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [starredIndices, setStarredIndices] = useState(new Set());
  const [showSaveModal, setShowSaveModal] = useState(false);

  const currentCard = shuffledCards[currentIndex] || {};

  const handleToggleShuffle = useCallback(() => {
    if (isShuffled) {
      setShuffledCards(cards);
      setIsShuffled(false);
    } else {
      setShuffledCards(shuffleArray(cards));
      setIsShuffled(true);
    }
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [isShuffled, cards]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < shuffledCards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((prev) => prev + 1), 150);
    }
  }, [currentIndex, shuffledCards.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((prev) => prev - 1), 150);
    }
  }, [currentIndex]);

  const toggleStar = (e) => {
    e.stopPropagation();
    setShowSaveModal(true);
    // Track local UI state if needed, but the modal handles saving
    setStarredIndices((prev) => {
      const next = new Set(prev);
      next.add(currentIndex);
      return next;
    });
  };

  const speak = (e, text, lang = "en") => {
    e.stopPropagation();
    ttsSpeak(text, lang);
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
              <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
                {currentCard.phonetic && (
                  <span className={styles.phonetic}>{currentCard.phonetic}</span>
                )}
                {currentCard.partOfSpeech && (
                  <span className={styles.partOfSpeech}>{currentCard.partOfSpeech}</span>
                )}
              </div>
            </div>
            <div className={styles.cardFooter}>
              <span>Chạm hoặc nhấn phím Cách để lật</span>
            </div>
          </div>

          {/* Back Side */}
          <div className={styles.cardBack}>
            <div className={styles.cardHeader}>
              <div className={styles.topActions} style={{ marginLeft: "auto" }}>
                <button className={styles.iconBtn} onClick={(e) => speak(e, currentCard.definition, "vi")}>
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
            {currentIndex + 1} / {shuffledCards.length}
          </div>
          <button 
            className={styles.navBtn} 
            onClick={handleNext} 
            disabled={currentIndex === shuffledCards.length - 1}
          >
            <ChevronRight size={24} />
          </button>
        </div>
        
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${((currentIndex + 1) / shuffledCards.length) * 100}%` }}></div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
          <button
            className={styles.navBtn}
            onClick={handleToggleShuffle}
            title={isShuffled ? 'Hủy xáo trộn' : 'Xáo trộn thẻ'}
            style={{ gap: '6px', fontSize: '13px', padding: '6px 14px', opacity: isShuffled ? 1 : 0.6 }}
          >
            <Shuffle size={16} /> {isShuffled ? 'Bỏ xáo trộn' : 'Xáo trộn'}
          </button>
        </div>
      </div>

      <SaveToNotebookModal 
        show={showSaveModal} 
        onHide={() => setShowSaveModal(false)}
        term={currentCard.term}
        definition={currentCard.definition}
      />
    </div>
  );
};

export default FlashcardPlayer;
