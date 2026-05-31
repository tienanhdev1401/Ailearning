import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/MulticheckPages.module.css";

export default function TopicPage() {
  // Lấy danh sách topics đã chọn từ sessionStorage (nếu có)
  const [selectedTopics, setSelectedTopics] = useState(() => {
    const saved = sessionStorage.getItem("topics");
    return saved ? JSON.parse(saved) : [];
  });

  const [showMore, setShowMore] = useState(false);
  const navigate = useNavigate();

  const allTopics = [
    { icon: "🌍", text: "Travel" },
    { icon: "💼", text: "Business" },
    { icon: "🏠", text: "Daily Life" },
    { icon: "🎬", text: "Entertainment" },
    { icon: "💻", text: "Technology" },
    { icon: "🏫", text: "Education" },
    { icon: "💬", text: "Communication" },
    { icon: "❤️", text: "Relationships" },
    { icon: "🍽️", text: "Food & Cooking" },
    { icon: "⚽", text: "Sports" },
    { icon: "🎵", text: "Music" },
    { icon: "📚", text: "Reading" },
    { icon: "🌿", text: "Health & Wellness" },
    { icon: "🎨", text: "Art & Culture" },
    { icon: "🧠", text: "Science" },
    { icon: "🏙️", text: "Lifestyle" },
    { icon: "🧳", text: "Adventure" },
    { icon: "🐾", text: "Animals" },
    { icon: "🌦️", text: "Nature" },
    { icon: "💰", text: "Finance" }
  ];

  const topics = showMore ? allTopics : allTopics.slice(0, 8);

  const handleSelect = (text) => {
    setSelectedTopics((prev) =>
      prev.includes(text) ? prev.filter((t) => t !== text) : [...prev, text]
    );
  };

  // Lưu vào sessionStorage mỗi khi selectedTopics thay đổi
  useEffect(() => {
    sessionStorage.setItem("topics", JSON.stringify(selectedTopics));
  }, [selectedTopics]);

  return (
    <div className={styles.page}>
      {/* Icon quay lại */}
      <button
        onClick={() => navigate("/welcome/goal")}
        className={styles.backButton}
      >
        ←
      </button>

      <div className={styles.container}>
        {/* Thanh tiến trình */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: "60%" }} />
        </div>

        {/* Tiêu đề */}
        <h2 className={styles.title}>
          What topics are you interested in?
        </h2>
        <p className={styles.subtitle}>
          Choose the topics you want to focus on.
        </p>

        {/* Danh sách lựa chọn */}
        <div className={styles.topicGrid}>
          {topics.map((t) => (
            <div
              key={t.text}
              className={`${styles.topicCard} ${selectedTopics.includes(t.text) ? styles.topicCardSelected : ""}`}
              onClick={() => handleSelect(t.text)}
            >
              <span className={styles.topicEmoji}>{t.icon}</span>
              <span className={styles.topicLabel}>{t.text}</span>
            </div>
          ))}
        </div>

        {/* Nút Show more / Show less */}
        <button
          className={styles.showMoreButton}
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? "Show less ▲" : "Show more ▼"}
        </button>

        {/* Nút Continue */}
        <div className={styles.ctaWrapper}>
          <button
            className={styles.continueButton}
            disabled={selectedTopics.length === 0}
            onClick={() => navigate("/welcome/proficiency")}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
