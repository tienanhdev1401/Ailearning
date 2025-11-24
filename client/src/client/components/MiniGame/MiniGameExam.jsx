import React, { useMemo, useState } from "react";
import styles from "../../styles/MiniGameExam.module.css";

const calcScore = (questions, answers) => {
  if (!questions.length) return { percent: 0, correct: 0 };
  const correctCount = questions.reduce((acc, question, index) => {
    const picked = answers[index];
    return picked === question.correctIndex ? acc + 1 : acc;
  }, 0);
  const percent = Math.round((correctCount / questions.length) * 100);
  return { percent, correct: correctCount };
};

const MiniGameExam = ({ data, onNext }) => {
  const questions = useMemo(() => {
    const list = Array.isArray(data?.resources?.questions) ? data.resources.questions : [];
    return list.map((question, index) => ({
      ...question,
      options: Array.isArray(question.options) ? question.options : [],
      id: index,
    }));
  }, [data]);

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleSelect = (questionIndex, optionIndex) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleSubmit = () => {
    if (!questions.length) return;
    const { percent } = calcScore(questions, answers);
    setScore(percent);
    setSubmitted(true);
  };

  const handleRetry = () => {
    setAnswers({});
    setScore(0);
    setSubmitted(false);
  };

  const allAnswered = questions.every((_, index) => typeof answers[index] === "number");
  const passed = submitted && score >= 80;

  return (
    <div className={styles.examContainer}>
      <header className={styles.examHeader}>
        <h2 className={styles.examTitle}>{data?.prompt || "Bài kiểm tra tổng kết"}</h2>
        <p className={styles.examSubtitle}>
          Hoàn thành tất cả câu hỏi. Đạt từ 80% trở lên để mở khóa hoạt động tiếp theo.
        </p>
      </header>

      <div className={styles.questionList}>
        {questions.map((question, index) => {
          const selected = answers[index];
          const showCorrect = submitted && typeof selected === "number";
          return (
            <article className={styles.questionCard} key={question.id}>
              <h3 className={styles.questionTitle}>
                Câu {index + 1}: {question.question}
              </h3>
              <div className={styles.optionList}>
                {question.options.map((option, optionIndex) => {
                  const isSelected = selected === optionIndex;
                  const isCorrectOption = showCorrect && question.correctIndex === optionIndex;
                  const isWrongSelection = showCorrect && isSelected && !isCorrectOption;

                  const optionClasses = [styles.optionButton];
                  if (isSelected) optionClasses.push(styles.optionSelected);
                  if (isCorrectOption) optionClasses.push(styles.optionCorrect, styles.optionDisabled);
                  if (isWrongSelection) optionClasses.push(styles.optionWrong, styles.optionDisabled);
                  if (submitted) optionClasses.push(styles.optionDisabled);

                  return (
                    <button
                      key={optionIndex}
                      type="button"
                      className={optionClasses.join(" ")}
                      onClick={() => handleSelect(index, optionIndex)}
                    >
                      {String.fromCharCode(65 + optionIndex)}. {option}
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}

        {!questions.length && <p>Hiện chưa có câu hỏi cho minigame này.</p>}
      </div>

      <footer className={styles.examFooter}>
        <div className={styles.buttonGroup}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleSubmit}
            disabled={!allAnswered || submitted}
          >
            Nộp bài
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={handleRetry}
            disabled={!submitted}
          >
            Làm lại
          </button>
        </div>

        {submitted && (
          <span className={`${styles.scoreBadge} ${score < 80 ? styles.scoreBadgeFail : ""}`}>
            Điểm số: {score}%
          </span>
        )}
      </footer>

      {submitted && score < 80 && (
        <div className={styles.failBanner}>
          Bạn chưa đạt 80%. Hãy xem lại đáp án và bấm "Làm lại" để thử lần nữa.
        </div>
      )}

      {passed && (
        <div className={styles.successBanner}>
          Xuất sắc! Bạn đã đạt {score}%. Bấm tiếp tục để mở khóa hoạt động kế tiếp.
        </div>
      )}

      {passed && (
        <div className={styles.nextWrapper}>
          <button type="button" className={styles.primaryBtn} onClick={onNext}>
            Tiếp tục
          </button>
        </div>
      )}
    </div>
  );
};

export default MiniGameExam;
