import React, { useState, useEffect, useCallback, useContext } from "react";
import { ThemeContext } from "../../../context/ThemeContext";
import { CheckCircleFill, XCircleFill, ArrowRight, VolumeUp } from "react-bootstrap-icons";
import styles from "../../styles/ABCDGame.module.css";

const ABCDGame = ({ cards }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const initQuestion = useCallback(() => {
    if (currentIndex >= cards.length) {
      setIsFinished(true);
      return;
    }

    const currentCard = cards[currentIndex];
    const otherCards = cards.filter((_, idx) => idx !== currentIndex);
    
    // Get 3 random wrong definitions
    const wrongOptions = [...otherCards]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(c => c.definition);
    
    // Combine and shuffle
    const allOptions = [currentCard.definition, ...wrongOptions]
      .sort(() => 0.5 - Math.random());
    
    setOptions(allOptions);
    setSelectedOption(null);
    setFeedback(null);
  }, [currentIndex, cards]);

  useEffect(() => {
    initQuestion();
  }, [initQuestion]);

  const handleSelect = (option) => {
    if (feedback) return;
    
    setSelectedOption(option);
    const isCorrect = option === cards[currentIndex].definition;
    
    if (isCorrect) {
      setFeedback('correct');
      setScore(prev => prev + 1);
    } else {
      setFeedback('wrong');
    }
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const restart = () => {
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
  };

  const speak = (text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  if (isFinished) {
    return (
      <div className={styles.resultScreen}>
        <div className={styles.scoreCircle}>
          <div className={styles.scoreText}>{Math.round((score / cards.length) * 100)}%</div>
        </div>
        <h2 className={styles.resultTitle}>Hoàn thành!</h2>
        <p className={styles.resultDesc}>Bạn đã trả lời đúng <strong>{score}</strong> trên tổng số <strong>{cards.length}</strong> câu.</p>
        <button className={styles.primaryBtn} onClick={restart}>Thử lại</button>
      </div>
    );
  }

  const progress = ((currentIndex) / cards.length) * 100;

  return (
    <div className={styles.gameContainer}>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
      </div>

      <div className={styles.questionBox}>
        <div className={styles.questionHeader}>
          <button className={styles.speakBtn} onClick={() => speak(cards[currentIndex].term)}>
            <VolumeUp size={24} />
          </button>
          <span className={styles.questionCount}>Câu {currentIndex + 1} / {cards.length}</span>
        </div>
        <h2 className={styles.termText}>"{cards[currentIndex].term}" nghĩa là gì?</h2>
      </div>

      <div className={styles.optionsGrid}>
        {options.map((option, idx) => {
          const isSelected = selectedOption === option;
          const isCorrect = option === cards[currentIndex].definition;
          
          let cardClass = styles.optionCard;
          if (feedback) {
            if (isCorrect) cardClass += ` ${styles.correct}`;
            else if (isSelected) cardClass += ` ${styles.wrong}`;
            else cardClass += ` ${styles.disabled}`;
          } else if (isSelected) {
            cardClass += ` ${styles.selected}`;
          }

          return (
            <button
              key={idx}
              className={cardClass}
              onClick={() => handleSelect(option)}
              disabled={!!feedback}
            >
              <div className={styles.optionIndex}>{String.fromCharCode(65 + idx)}</div>
              <div className={styles.optionText}>{option}</div>
              {feedback && isCorrect && <CheckCircleFill className={styles.statusIcon} />}
              {feedback && isSelected && !isCorrect && <XCircleFill className={styles.statusIcon} />}
            </button>
          );
        })}
      </div>

      {feedback && (
        <div className={styles.footer}>
          <div className={`${styles.feedbackMsg} ${feedback === 'correct' ? styles.msgCorrect : styles.msgWrong}`}>
            {feedback === 'correct' ? "Chính xác! Làm tốt lắm." : `Chưa đúng. Đáp án là: ${cards[currentIndex].definition}`}
          </div>
          <button className={styles.nextBtn} onClick={handleNext}>
            {currentIndex < cards.length - 1 ? "Tiếp theo" : "Xem kết quả"} <ArrowRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default ABCDGame;
