import React from 'react';
import styles from '../styles/Footer.module.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Footer Content */}
        <div className={styles.content}>
          <div className={styles.section}>
            <h3>Về AelanG</h3>
            <p>Ứng dụng học tiếng Anh hiện đại với công nghệ AI, giúp bạn cải thiện kỹ năng nghe, nói, đọc, viết.</p>
          </div>

          <div className={styles.section}>
            <h3>Liên Kết Nhanh</h3>
            <ul>
              <li><a href="#learn">Học Tập</a></li>
              <li><a href="#ai">AI Tutor</a></li>
              <li><a href="#leaderboard">Bảng Xếp Hạng</a></li>
              <li><a href="#shop">Cửa Hàng</a></li>
            </ul>
          </div>

          <div className={styles.section}>
            <h3>Hỗ Trợ</h3>
            <ul>
              <li><a href="#help">Trợ Giúp</a></li>
              <li><a href="#contact">Liên Hệ</a></li>
              <li><a href="#faq">Câu Hỏi Thường Gặp</a></li>
              <li><a href="#privacy">Chính Sách Riêng Tư</a></li>
            </ul>
          </div>

          <div className={styles.section}>
            <h3>Kết Nối</h3>
            <div className={styles.socialLinks}>
              <a href="#facebook" className={styles.socialIcon}>f</a>
              <a href="#twitter" className={styles.socialIcon}>𝕏</a>
              <a href="#instagram" className={styles.socialIcon}>📷</a>
              <a href="#youtube" className={styles.socialIcon}>▶️</a>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className={styles.bottom}>
          <p>&copy; {currentYear} AelanG. Bảo lưu mọi quyền.</p>
          <div className={styles.links}>
            <a href="#terms">Điều Khoản Dịch Vụ</a>
            <span>•</span>
            <a href="#privacy">Chính Sách Riêng Tư</a>
            <span>•</span>
            <a href="#cookies">Chính Sách Cookie</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
