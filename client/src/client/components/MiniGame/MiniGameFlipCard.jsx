import React, { useState, useEffect, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/MiniGameFlipCard.module.css";
import { ThemeContext } from "../../../context/ThemeContext";
import { shuffleArray } from "../../../utils/array";
import { speak } from "../../../utils/tts";
import SaveToNotebookModal from "../Flashcard/SaveToNotebookModal";

const MiniGameFlipCard = ({ data, onNext }) => {
  const navigate = useNavigate();
  const cards = useMemo(() => Array.isArray(data?.resources?.cards) ? data.resources.cards : [], [data]);
  const { isDarkMode } = useContext(ThemeContext);

  const [mode, setMode] = useState("learning"); // learning | practice | completed
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [practiceCards, setPracticeCards] = useState([]);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savingCard, setSavingCard] = useState(null);

  // Initialize practice options when index changes in practice mode
  useEffect(() => {
    const activeCards = mode === "practice" ? practiceCards : cards;
    if (mode === "practice" && activeCards.length > 0) {
      const currentCard = activeCards[currentIndex];
      const otherCards = activeCards.filter((_, idx) => idx !== currentIndex);

      // Get 3 random wrong definitions
      const wrongOptions = shuffleArray([...otherCards])
        .slice(0, Math.min(3, otherCards.length))
        .map(c => c.definition);

      const allOptions = shuffleArray([currentCard.definition, ...wrongOptions]);

      setShuffledOptions(allOptions);
      setSelectedOption(null);
      setFeedback(null);
    }
  }, [mode, currentIndex, cards, practiceCards]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleSaveNoteClick = (e, card) => {
    e.stopPropagation();
    setSavingCard(card);
    setShowSaveModal(true);
  };

  const handleNextLearned = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
    } else {
      // Shuffle cards for practice mode
      setPracticeCards(shuffleArray([...cards]));
      setMode("practice");
      setCurrentIndex(0);
    }
  };

  const handlePrevLearned = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex - 1), 300);
    }
  };

  const handleSelectOption = (option) => {
    if (feedback !== null) return;

    setSelectedOption(option);
    const activeCards = mode === "practice" ? practiceCards : cards;
    const isCorrect = option === activeCards[currentIndex].definition;

    if (isCorrect) {
      setFeedback(true);
      setScore(score + 1);
      setTimeout(() => {
        setFeedback(null); // Clear feedback
        if (currentIndex < activeCards.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          setMode("completed");
        }
      }, 1500);
    } else {
      setFeedback(false);
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  const progress = cards.length > 0
    ? Math.round(((currentIndex + 1) / cards.length) * 100)
    : 0;

  if (cards.length === 0) {
    return (
      <div className={styles.gameContainer}>
        <div className="text-center mt-5">Hiện chưa có dữ liệu cho phần này.</div>
      </div>
    );
  }

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameHeader}>
        <h2 className={styles.prompt}>{mode === "learning" ? "Ghi nhớ các từ sau" : "Chọn nghĩa đúng cho từ"}</h2>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${mode === 'completed' ? 100 : progress}%` }}></div>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <span className={styles.progressText}>
            {mode === "learning" ? "Học: " : mode === "practice" ? "Luyện tập: " : "Hoàn thành!"}
            {mode !== "completed" ? `${currentIndex + 1} / ${cards.length}` : ""}
          </span>
          <div className="d-flex gap-2">
            {mode === "learning" && (
              <button
                className="btn btn-sm btn-outline-primary rounded-pill border-2 fw-bold"
                onClick={() => navigate(`/flashcards/${data.id}`)}
                style={{ fontSize: '12px' }}
              >
                Mở trang Flashcard học tập
              </button>
            )}
            {mode === "practice" && <span className={styles.progressText}>Điểm: {score}</span>}
          </div>
        </div>
      </div>

      {savingCard && (
        <SaveToNotebookModal
          show={showSaveModal}
          onHide={() => setShowSaveModal(false)}
          term={savingCard.term}
          definition={savingCard.definition}
        />
      )}

      {feedback !== null && (
        <div className={`${styles.feedbackOverlay} ${feedback ? styles.feedbackSuccess : styles.feedbackError}`}>
          <div className={styles.feedbackContent}>
            {feedback ? (
              <>
                <span className={styles.feedbackIcon}>✅</span>
                <span className={styles.feedbackText}>Chính xác!</span>
              </>
            ) : (
              <>
                <span className={styles.feedbackIcon}>💡</span>
                <span className={styles.feedbackText}>Gần đúng rồi, hãy thử lại!</span>
              </>
            )}
          </div>
        </div>
      )}

      {mode === "learning" && (
        <div className={styles.learningView}>
          <div className={styles.cardStage} onClick={handleFlip}>
            <div className={`${styles.flashcard} ${isFlipped ? styles.isFlipped : ""}`}>
              <div className={styles.cardFront}>
                <button
                  className={styles.saveBtn}
                  onClick={(e) => handleSaveNoteClick(e, cards[currentIndex])}
                  title="Lưu vào Sổ tay"
                >
                  📖
                </button>
                <button
                  className={styles.speakerBtn}
                  onClick={(e) => { e.stopPropagation(); speak(cards[currentIndex].term, 'en'); }}
                  title="Phát âm tiếng Anh"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={16} height={16}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                  </svg>
                </button>
                <span className={styles.cardLabel}>Thuật ngữ</span>
                <div className={styles.cardContent}>{cards[currentIndex].term}</div>
                <div className="d-flex flex-wrap justify-content-center gap-2 mt-2">
                  {cards[currentIndex].phonetic && (
                    <span className={styles.phonetic}>{cards[currentIndex].phonetic}</span>
                  )}
                  {cards[currentIndex].partOfSpeech && (
                    <span className={styles.partOfSpeech}>{cards[currentIndex].partOfSpeech}</span>
                  )}
                </div>
                <div className="mt-4 small" style={{ color: isDarkMode ? '#6c757d' : '#999' }}>Chạm để xem nghĩa</div>
              </div>
              <div className={styles.cardBack}>
                <button
                  className={styles.speakerBtn}
                  onClick={(e) => { e.stopPropagation(); speak(cards[currentIndex].definition, 'vi'); }}
                  title="Đọc tiếng Việt"
                  style={{ position: 'absolute', top: '12px', right: '12px' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={16} height={16}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                  </svg>
                </button>
                <span className={styles.cardLabel}>Định nghĩa</span>
                <div className={styles.cardContent}>{cards[currentIndex].definition}</div>
              </div>
            </div>
          </div>

          <div className={styles.learningControls}>
            <button
              className={styles.navButton}
              onClick={handlePrevLearned}
              disabled={currentIndex === 0}
            >
              Trước
            </button>
            <button className={styles.navButton} onClick={handleNextLearned}>
              {currentIndex < cards.length - 1 ? "Tiếp theo" : "Bắt đầu luyện tập"}
            </button>
          </div>
        </div>
      )}

      {mode === "practice" && (
        <div className={styles.practiceView}>
          <div className={styles.questionBox}>
            <div className={styles.question}>
              "{practiceCards[currentIndex]?.term}" nghĩa là gì?
            </div>
            <div className={styles.optionsGrid}>
              {shuffledOptions.map((option, idx) => (
                <button
                  key={idx}
                  className={`${styles.optionButton} ${selectedOption === option
                    ? (option === practiceCards[currentIndex]?.definition ? styles.correctOption : styles.wrongOption)
                    : ""
                    }`}
                  onClick={() => handleSelectOption(option)}
                  disabled={feedback !== null}
                >
                  <span>{option}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === "completed" && (
        <div className={styles.completionContainer}>
          <h1 className={styles.completionText}>Tuyệt vời!</h1>
          <p className="mb-4 fs-5" style={{ color: isDarkMode ? '#adb5bd' : '#6c757d' }}>Bạn đã hoàn thành bài học và đạt {score}/{cards.length} câu đúng!</p>
          <button onClick={onNext} className={styles.nextButton}>
            Hoàn thành 🎯
          </button>
        </div>
      )}
    </div>
  );
};

export default MiniGameFlipCard;
