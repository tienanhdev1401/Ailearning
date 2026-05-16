import React, { useState, useEffect, useRef, useContext } from "react";
import { ThemeContext } from "../../../context/ThemeContext";
import { CheckCircleFill, XCircleFill, ArrowRight, VolumeUp, Lightbulb } from "react-bootstrap-icons";
import styles from "../../styles/WritingGame.module.css";
import { speak as ttsSpeak } from "../../../utils/tts";
import { shuffleArray } from "../../../utils/array";

const WritingGame = ({ cards }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [shuffledCards, setShuffledCards] = useState(() => shuffleArray(cards));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    if (!feedback && !isFinished) {
      inputRef.current?.focus();
    }
  }, [feedback, isFinished, currentIndex]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (feedback || !userInput.trim()) return;

    const correctTerm = shuffledCards[currentIndex].term.trim().toLowerCase();
    const userTerm = userInput.trim().toLowerCase();

    if (userTerm === correctTerm) {
      setFeedback("correct");
      setScore((prev) => prev + 1);
    } else {
      setFeedback("wrong");
    }
  };

  const handleSkip = () => {
    if (feedback) return;
    setFeedback("wrong");
    setShowHint(true);
  };

  const handleNext = () => {
    if (currentIndex < shuffledCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setUserInput("");
      setFeedback(null);
      setShowHint(false);
    } else {
      setIsFinished(true);
    }
  };

  const restart = () => {
    setShuffledCards(shuffleArray(cards)); // Reshuffle on restart
    setCurrentIndex(0);
    setUserInput("");
    setFeedback(null);
    setScore(0);
    setIsFinished(false);
    setShowHint(false);
  };

  const speak = (text, lang = "en") => {
    ttsSpeak(text, lang);
  };

  const getHint = () => {
    const term = shuffledCards[currentIndex].term;
    if (term.length <= 2) return term;
    const middle = "_ ".repeat(term.length - 2).trim();
    return `${term.charAt(0)} ${middle} ${term.charAt(term.length - 1)}`;
  };

  if (isFinished) {
    return (
      <div className={styles.resultScreen}>
        <div className={styles.scoreCircle}>
          <div className={styles.scoreText}>{Math.round((score / shuffledCards.length) * 100)}%</div>
        </div>
        <h2 className={styles.resultTitle}>Tuyệt vời!</h2>
        <p className={styles.resultDesc}>
          Bạn đã hoàn thành chế độ luyện viết với <strong>{score}</strong>/{shuffledCards.length} câu chính xác.
        </p>
        <button className={styles.primaryBtn} onClick={restart}>Học lại</button>
      </div>
    );
  }

  const progress = (currentIndex / cards.length) * 100;

  return (
    <div className={styles.gameContainer}>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
      </div>

      <div className={styles.questionBox}>
        <div className={styles.questionHeader}>
          <span className={styles.questionCount}>Câu {currentIndex + 1} / {shuffledCards.length}</span>
          <button
            className={styles.hintBtn}
            onClick={() => setShowHint(true)}
            disabled={showHint || !!feedback}
            title="Gợi ý"
          >
            <Lightbulb />
          </button>
        </div>

        <p className={styles.definitionLabel}>Định nghĩa:</p>
        <h2 className={styles.definitionText}>{shuffledCards[currentIndex].definition}</h2>

        {showHint && (
          <div className={styles.hintBox}>
            Gợi ý: <strong>{getHint()}</strong>
          </div>
        )}
      </div>

      <form className={styles.inputSection} onSubmit={handleSubmit}>
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            type="text"
            className={`${styles.input} ${feedback ? styles[feedback] : ""}`}
            placeholder="Gõ thuật ngữ tại đây..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={!!feedback}
            autoComplete="off"
          />
          {feedback === "correct" && <CheckCircleFill className={styles.statusIconInside} />}
          {feedback === "wrong" && <XCircleFill className={styles.statusIconInside} />}
        </div>

        {!feedback ? (
          <div className={styles.buttonGroup}>
            <button type="button" className={styles.skipBtn} onClick={handleSkip}>
              Bỏ qua
            </button>
            <button type="submit" className={styles.submitBtn} disabled={!userInput.trim()}>
              Kiểm tra
            </button>
          </div>
        ) : (
          <button type="button" className={styles.nextBtn} onClick={handleNext}>
            Tiếp theo <ArrowRight />
          </button>
        )}
      </form>

      {feedback === "wrong" && (
        <div className={styles.feedbackWrongArea}>
          <p className={styles.wrongLabel}>Đáp án đúng là:</p>
          <div className={styles.correctTermDisplay}>
            <span className={styles.correctTermValue}>{shuffledCards[currentIndex].term}</span>
            <button className={styles.speakBtnSmall} onClick={() => speak(shuffledCards[currentIndex].term)}>
              <VolumeUp size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WritingGame;
