import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/MulticheckPages.module.css";

export default function ReasonPage() {
  const [selected, setSelected] = useState(
    sessionStorage.getItem("reason") || "Challenge myself"
  );
  const navigate = useNavigate();

  const reasons = [
    { icon: "🤝", text: "Work" },
    { icon: "📘", text: "School" },
    { icon: "✈️", text: "Travel" },
    { icon: "🖼️", text: "Culture" },
    { icon: "🙌", text: "Family & community" },
    { icon: "💪", text: "Challenge myself" },
    { icon: "💭", text: "Other" },
  ];

  // Lưu vào sessionStorage khi người dùng chọn
  useEffect(() => {
    if (selected) {
      sessionStorage.setItem("reason", selected);
    }
  }, [selected]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Thanh tiến trình */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: "20%" }} />
        </div>

        {/* Tiêu đề */}
        <h2 className={styles.title}>
          Hi <span className={styles.titleHighlight}>Learner</span>, why are you learning English?
        </h2>
        <p className={styles.subtitle}>
          Help us tailor your learning experience.
        </p>

        {/* Danh sách lựa chọn */}
        <div className={styles.optionList}>
          {reasons.map((r) => (
            <div
              key={r.text}
              className={`${styles.optionCard} ${selected === r.text ? styles.optionCardSelected : ""}`}
              onClick={() => setSelected(r.text)}
            >
              <div className={styles.optionIcon}>{r.icon}</div>
              <div className={styles.optionContent}>
                <div className={styles.optionLabel}>{r.text}</div>
              </div>
              <div className={styles.optionCheck}>✓</div>
            </div>
          ))}
        </div>

        {/* Nút Continue */}
        <div className={styles.ctaWrapper}>
          <button
            className={styles.continueButton}
            onClick={() => navigate("/welcome/goal")}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
