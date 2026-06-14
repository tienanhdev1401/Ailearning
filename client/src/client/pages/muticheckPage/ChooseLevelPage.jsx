import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import { useToast } from "../../../context/ToastContext";
import styles from "../../styles/MulticheckPages.module.css";

const ChooseLevelPage = () => {
  const levels = [
    { icon: "🌱", label: "Beginner A1" },
    { icon: "🌿", label: "Elementary A2" },
    { icon: "🪴", label: "Intermediate B1" },
    { icon: "🌳", label: "Upper Intermediate B2" },
    { icon: "🌸", label: "Advanced C1" },
    { icon: "🌟", label: "Proficient C2" }
  ];

  // Lấy lại giá trị level từ sessionStorage nếu có
  const [selected, setSelected] = useState(() => {
    const saved = sessionStorage.getItem("level");
    if (saved) {
      return levels.findIndex((l) => l.label === saved);
    }
    return null;
  });

  const navigate = useNavigate();
  const toast = useToast();

  // Khi chọn level, lưu tên (label) vào sessionStorage
  const handleSelect = (index) => {
    setSelected(index);
    sessionStorage.setItem("level", levels[index].label);
  };

  // Gửi dữ liệu khi nhấn Finish
  const handleFinish = async () => {
    const reason = sessionStorage.getItem("reason");
    const goal = sessionStorage.getItem("goal");
    const proficiency = sessionStorage.getItem("proficiency");
    const level = sessionStorage.getItem("level");
    const topics = sessionStorage.getItem("topics");

    const confirmData = {
      reason,
      goal: goal ? JSON.parse(goal) : null,
      proficiency,
      level,
      topics: topics ? JSON.parse(topics) : [],
    };

    try {
      await api.post("/confirm/", confirmData);

      toast.success("Cảm ơn bạn đã dành thời gian xác thực!");
    } catch (error) {
      console.error("Lỗi khi gửi dữ liệu:", error);
    }

    // Chuyển sang trang AI đề xuất lộ trình (không xóa sessionStorage)
    navigate("/welcome/recommendation");
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

      <div className={styles.container}>
        {/* Thanh tiến trình */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: "100%" }} />
        </div>

        {/* Tiêu đề */}
        <h2 className={styles.title}>Choose your level</h2>
        <p className={styles.subtitle}>
          We'll match you to the right lessons
        </p>

        {/* Danh sách lựa chọn */}
        <div className={styles.optionList}>
          {levels.map((level, index) => (
            <div
              key={index}
              className={`${styles.optionCard} ${selected === index ? styles.optionCardSelected : ""}`}
              onClick={() => handleSelect(index)}
            >
              <div className={styles.optionIcon}>{level.icon}</div>
              <div className={styles.optionContent}>
                <div className={styles.optionLabel}>{level.label}</div>
              </div>
              <div className={styles.optionCheck}>✓</div>
            </div>
          ))}
        </div>

        {/* Nút Finish */}
        <div className={styles.ctaWrapper}>
          <button
            className={styles.continueButton}
            disabled={selected === null}
            onClick={handleFinish}
          >
            Finish
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChooseLevelPage;
