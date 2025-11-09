import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Home.module.css";

const HomePage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: "👂",
      title: "Nghe",
      description: "Cải thiện khả năng nghe với các bài tập nghe thực tế",
      color: "#38bdf8"
    },
    {
      icon: "🗣️",
      title: "Nói",
      description: "Luyện tập phát âm chuẩn với AI tutor thông minh",
      color: "#f472b6"
    },
    {
      icon: "📖",
      title: "Đọc",
      description: "Phát triển kỹ năng đọc hiểu qua các bài viết thú vị",
      color: "#a3e635"
    },
    {
      icon: "✍️",
      title: "Viết",
      description: "Rèn luyện kỹ năng viết và kiểm tra văn phạm tự động",
      color: "#facc15"
    }
  ];

  const stats = [
    { number: "10K+", label: "Người Dùng" },
    { number: "500+", label: "Bài Học" },
    { number: "1M+", label: "Từ Vựng" },
    { number: "24/7", label: "Hỗ Trợ" }
  ];

  const handleStartLearning = (skillType) => {
    navigate(`/learn/${skillType}`);
  };

  return (
    <div className={styles.homepage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.title}>
              Học Tiếng Anh Cùng <span className={styles.highlight}>AelanG</span>
            </h1>
            <p className={styles.subtitle}>
              Ứng dụng học tiếng Anh thông minh với công nghệ AI. Cải thiện các kỹ năng nghe, nói, đọc, viết của bạn hôm nay.
            </p>
            <div className={styles.heroCTA}>
              <button 
                className={styles.primaryBtn}
                onClick={() => handleStartLearning("all")}
              >
                Bắt Đầu Học Ngay
              </button>
              <button 
                className={styles.secondaryBtn}
                onClick={() => navigate("/about")}
              >
                Tìm Hiểu Thêm
              </button>
            </div>
          </div>
          <div className={styles.heroImage}>
            <img
              src="/assets/img/hero/hero2.png"
              alt="Học tiếng Anh cùng AelanG"
              className={styles.heroIllustration}
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.stats}>
        <div className={styles.statsContainer}>
          {stats.map((stat, index) => (
            <div key={index} className={styles.statItem}>
              <div className={styles.statNumber}>{stat.number}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.sectionHeader}>
          <h2>4 Kỹ Năng Chính</h2>
          <p>Phát triển toàn diện các kỹ năng tiếng Anh của bạn</p>
        </div>
        <div className={styles.featureGrid}>
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={styles.featureCard}
              onClick={() => handleStartLearning(feature.title.toLowerCase())}
              style={{ '--feature-color': feature.color }}
            >
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDesc}>{feature.description}</p>
              <button className={styles.featureBtn}>Bắt Đầu →</button>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className={styles.howItWorks}>
        <div className={styles.sectionHeader}>
          <h2>Cách Thức Hoạt Động</h2>
          <p>3 bước đơn giản để bắt đầu hành trình học tập của bạn</p>
        </div>
        <div className={styles.stepsContainer}>
          {[
            { number: "01", title: "Chọn Kỹ Năng", desc: "Chọn kỹ năng bạn muốn phát triển" },
            { number: "02", title: "Học Bài", desc: "Làm các bài tập được thiết kế kỹ lưỡng" },
            { number: "03", title: "Tiến Bộ", desc: "Theo dõi tiến độ và nhận phần thưởng" }
          ].map((step, index) => (
            <div key={index} className={styles.step}>
              <div className={styles.stepNumber}>{step.number}</div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.desc}</p>
              {index < 2 && <div className={styles.stepArrow}>→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* AI Tutor Section */}
      <section className={styles.aiTutor}>
        <div className={styles.aiContent}>
          <div className={styles.aiText}>
            <h2>AI Tutor Thông Minh</h2>
            <p>Được trang bị công nghệ AI tiên tiến, AelanG cung cấp các bài tập được cá nhân hóa dựa trên mức độ và mục tiêu của bạn.</p>
            <ul className={styles.aiFeatures}>
              <li>✓ Phản hồi ngay lập tức cho mỗi bài tập</li>
              <li>✓ Giải thích chi tiết quy tắc ngữ pháp</li>
              <li>✓ Đề xuất từ vựng được cá nhân hóa</li>
              <li>✓ Lộ trình học tập thích ứng</li>
            </ul>
            <button 
              className={styles.primaryBtn}
              onClick={() => navigate("/experience/ai-chat")}
            >
              Trải Nghiệm AI Tutor
            </button>
          </div>
          <div className={styles.aiImage}>
            <img
              src="/assets/img/hero/hero3.png"
              alt="Minh họa AI Tutor"
              className={styles.aiIllustration}
            />
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className={styles.achievements}>
        <div className={styles.sectionHeader}>
          <h2>Hệ Thống Thành Tựu</h2>
          <p>Nhận huy hiệu, điểm số và thăng cấp khi bạn học</p>
        </div>
        <div className={styles.achievementGrid}>
          {[
            { emoji: "🥇", text: "Huy Hiệu Vàng", unlock: "Hoàn thành 10 bài học" },
            { emoji: "🔥", text: "Chuỗi Liên Tiếp", unlock: "Học 7 ngày liên tiếp" },
            { emoji: "👑", text: "Vô Địch", unlock: "Dẫn đầu bảng xếp hạng" },
            { emoji: "💎", text: "Thạc Sĩ", unlock: "Hoàn thành 50 bài học" }
          ].map((achievement, index) => (
            <div key={index} className={styles.achievementCard}>
              <div className={styles.achievementEmoji}>{achievement.emoji}</div>
              <h4>{achievement.text}</h4>
              <p>{achievement.unlock}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2>Sẵn Sàng Bắt Đầu Hành Trình Của Bạn?</h2>
          <p>Hôm nay là ngày tốt nhất để bắt đầu học tiếng Anh. Với AelanG, bạn sẽ thấy sự tiến bộ chỉ trong vài tuần.</p>
          <button 
            className={styles.primaryBtn}
            onClick={() => handleStartLearning("all")}
          >
            Bắt Đầu Miễn Phí
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
