import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/MulticheckPages.module.css";

const FindLevelPage = () => {
  const navigate = useNavigate();

  const handleFindLevel = () => {
    navigate("/welcome/placement/test");
  };

  return (
    <div className={styles.page}>
      {/* Nút quay lại */}
      <button
        onClick={() => navigate("/welcome/proficiency")}
        className={styles.backButton}
      >
        ←
      </button>

      <div className={styles.container} style={{ textAlign: "center" }}>
        {/* Illustration */}
        <div className={styles.illustrationWrapper}>
          <img
            src="https://cdn-icons-png.freepik.com/512/5585/5585376.png"
            alt="Find Level Icon"
            className={styles.illustration}
          />
        </div>

        {/* Tiêu đề chính */}
        <h2 className={styles.title}>
          Let's find the right place to start your language-learning journey
        </h2>

        {/* Mô tả phụ */}
        <p className={styles.subtitle}>
          The questions should take 5 minutes or less.
        </p>

        {/* Nút bắt đầu */}
        <div className={styles.ctaWrapper}>
          <button
            className={styles.continueButton}
            onClick={handleFindLevel}
          >
            Find my level
          </button>
        </div>
      </div>
    </div>
  );
};

export default FindLevelPage;
