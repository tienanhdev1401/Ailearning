import React, { useState, useEffect, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/MiniGameFlipCard.module.css";
import { ThemeContext } from "../../../context/ThemeContext";
import vocabNoteService from "../../../services/vocabNoteService";

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
  const [savingCards, setSavingCards] = useState({}); // Keep track of saved status: { index: loading|success|error }
  const [toastMessage, setToastMessage] = useState(null);

  const speak = (text) => {
    if (!text) return;
    window.speechSynthesis.cancel(); // Stop current speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  // Initialize practice options when index changes in practice mode
  useEffect(() => {
    const activeCards = mode === "practice" ? practiceCards : cards;
    if (mode === "practice" && activeCards.length > 0) {
      const currentCard = activeCards[currentIndex];
      const otherCards = activeCards.filter((_, idx) => idx !== currentIndex);

      // Get 3 random wrong definitions
      const wrongOptions = [...otherCards]
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(3, otherCards.length))
        .map(c => c.definition);

      const allOptions = [currentCard.definition, ...wrongOptions]
        .sort(() => 0.5 - Math.random());

      setShuffledOptions(allOptions);
      setSelectedOption(null);
      setFeedback(null);
    }
  }, [mode, currentIndex, cards, practiceCards]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleSaveNote = async (e, card, index) => {
    e.stopPropagation();

    // Nếu đang loading → không cho bấm
    if (savingCards[index] === 'loading') return;

    // Nếu đã lưu → hiện toast thôi
    if (savingCards[index] === 'success') {
      setToastMessage({ type: 'info', text: `"${card.term}" đã được lưu rồi!` });
      setTimeout(() => setToastMessage(null), 2000);
      return;
    }

    setSavingCards(prev => ({ ...prev, [index]: 'loading' }));

    try {
      await vocabNoteService.addNote(card.term, card.definition, "MiniGame Flip Card");

      // Vẫn giữ trạng thái success (để biết đã lưu)
      setSavingCards(prev => ({ ...prev, [index]: 'success' }));

      setToastMessage({ type: 'success', text: `Đã lưu "${card.term}" vào sổ tay!` });
      setTimeout(() => setToastMessage(null), 3000);

    } catch (err) {
      setSavingCards(prev => ({ ...prev, [index]: 'error' }));
      const errorMsg = err.response?.data?.message || "Lỗi khi lưu từ.";
      setToastMessage({ type: 'error', text: errorMsg });
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleNextLearned = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
    } else {
      // Shuffle cards for practice mode
      setPracticeCards([...cards].sort(() => 0.5 - Math.random()));
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
            <button 
              className="btn btn-sm btn-outline-primary rounded-pill border-2 fw-bold"
              onClick={() => navigate(`/flashcards/${data.id}`)}
              style={{ fontSize: '12px' }}
            >
              🚀 Mở trang Flashcard học tập
            </button>
            {mode === "practice" && <span className={styles.progressText}>Điểm: {score}</span>}
          </div>
        </div>
      </div>

      {/* Simple Toast for Save feature */}
      {toastMessage && (
        <div style={{
          position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
          background: toastMessage.type === 'success' ? '#28a745' : '#dc3545', color: 'white',
          padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px',
          boxShadow: '0 4px 6px rgba(0,00,0,0.1)'
        }}>
          {toastMessage.text}
        </div>
      )}

      {feedback !== null && (
        <div className={`${styles.feedbackOverlay} ${feedback ? styles.feedbackSuccess : styles.feedbackError}`}>
          <div className={styles.feedbackContent}>
            {feedback ? (
              <>
                <span className={styles.feedbackIcon}>🎓</span>
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
                  className={`${styles.saveBtn} ${savingCards[currentIndex] === 'success' ? styles.savedBtn : ''}`}
                  onClick={(e) => handleSaveNote(e, cards[currentIndex], currentIndex)}
                  title="Lưu vào Sổ tay"
                  disabled={savingCards[currentIndex] === 'loading'}
                >
                  {savingCards[currentIndex] === 'loading' ? '⏳' : '📖'}
                </button>
                <button
                  className={styles.speakerBtn}
                  onClick={(e) => { e.stopPropagation(); speak(cards[currentIndex].term); }}
                  title="Phát âm"
                >
                  🔊
                </button>
                <span className={styles.cardLabel}>Thuật ngữ</span>
                <div className={styles.cardContent}>{cards[currentIndex].term}</div>
                <div className="mt-4 small" style={{ color: isDarkMode ? '#6c757d' : '#999' }}>Chạm để xem nghĩa</div>
              </div>
              <div className={styles.cardBack}>
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
              <button
                className={styles.speakerBtnInline}
                onClick={() => speak(practiceCards[currentIndex]?.term)}
                title="Phát âm"
              >
                🔊
              </button>
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
                  {option}
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
