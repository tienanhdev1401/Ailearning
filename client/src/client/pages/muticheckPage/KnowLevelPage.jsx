import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/MulticheckPages.module.css";

const KnowLevelPage = () => {
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const options = [
    {
      icon: "👍",
      label: "I Know My Level",
      description: "Select it now"
    },
    {
      icon: "🔍",
      label: "I need help to know level",
      description: "Answer a few questions to find your level"
    }
  ];

  const handleSelect = (index) => {
    setSelected(index);
  };

  const handleContinue = () => {
    if (selected === 0) {
      navigate("/welcome/level");
    } else if (selected === 1) {
      navigate("/welcome/placement");
    }
  };

  return (
    <div className={styles.page}>
      {/* Nút quay lại */}
      <button
        onClick={() => navigate("/welcome/topic")}
        className={styles.backButton}
      >
        ←
      </button>

      <div className={styles.container}>
        {/* Thanh tiến trình */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: "80%" }} />
        </div>

        {/* Tiêu đề */}
        <h2 className={styles.title}>Do you already know your level?</h2>
        <p className={styles.subtitle}>
          We'll match you to the right lessons
        </p>

        {/* Danh sách lựa chọn */}
        <div className={styles.optionList}>
          {options.map((option, index) => (
            <div
              key={index}
              className={`${styles.optionCard} ${selected === index ? styles.optionCardSelected : ""}`}
              onClick={() => handleSelect(index)}
            >
              <div className={styles.optionIcon}>{option.icon}</div>
              <div className={styles.optionContent}>
                <div className={styles.optionLabel}>{option.label}</div>
                <div className={styles.optionDescription}>{option.description}</div>
              </div>
              <div className={styles.optionCheck}>✓</div>
            </div>
          ))}
        </div>

        {/* Nút Continue */}
        <div className={styles.ctaWrapper}>
          <button
            className={styles.continueButton}
            disabled={selected === null}
            onClick={handleContinue}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default KnowLevelPage;