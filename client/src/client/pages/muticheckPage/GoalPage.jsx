import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/MulticheckPages.module.css";

const GoalPage = () => {
  const [selected, setSelected] = useState(() => {
    const storedGoal = sessionStorage.getItem("goal");
    return storedGoal ? JSON.parse(storedGoal) : null;
  });
  const navigate = useNavigate();

  const goals = [
    { time: "5 minutes / day", label: "Casual", icon: "☕" },
    { time: "10 minutes / day", label: "Regular", icon: "📖" },
    { time: "15 minutes / day", label: "Serious", icon: "🔥" },
    { time: "25 minutes / day", label: "Intense", icon: "⚡" },
  ];

  const handleSelect = (goal) => {
    setSelected(goal);
  };

  const handleCommit = () => {
    if (selected) {
      navigate("/welcome/topic");
    }
  };

  // 🔥 Lưu giá trị thực của goal (object) vào sessionStorage
  useEffect(() => {
    if (selected) {
      sessionStorage.setItem("goal", JSON.stringify(selected));
    }
  }, [selected]);

  return (
    <div className={styles.page}>
      {/* Nút quay lại */}
      <button
        onClick={() => navigate("/welcome/reason")}
        className={styles.backButton}
      >
        ←
      </button>

      <div className={styles.container}>
        {/* Thanh tiến trình */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: "40%" }} />
        </div>

        {/* Illustration */}
        <div className={styles.illustrationWrapper}>
          <img
            src="/assets/img/icon/muctieu.png"
            alt="Target icon"
            className={styles.illustration}
            style={{ width: "150px", height: "120px" }}
          />
        </div>

        {/* Tiêu đề */}
        <h2 className={styles.title}>Set a daily study goal</h2>
        <p className={styles.subtitle}>
          Create a learning habit to improve your English.
        </p>

        {/* Danh sách lựa chọn */}
        <div className={styles.optionList}>
          {goals.map((goal, index) => (
            <div
              key={index}
              className={`${styles.optionCard} ${selected?.label === goal.label ? styles.optionCardSelected : ""}`}
              onClick={() => handleSelect(goal)}
            >
              <div className={styles.optionIcon}>{goal.icon}</div>
              <div className={styles.optionContent}>
                <div className={styles.optionLabel}>{goal.time}</div>
              </div>
              <div className={styles.optionValue}>{goal.label}</div>
            </div>
          ))}
        </div>

        {/* Nút Continue */}
        <div className={styles.ctaWrapper}>
          <button
            className={styles.continueButton}
            disabled={!selected}
            onClick={handleCommit}
          >
            Commit to daily goal
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalPage;
