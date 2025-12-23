import React, { useEffect, useState, useCallback } from "react";
import styles from "./Toast.module.css";

/**
 * Component Toast - Hiển thị thông báo popup đẹp
 * @param {string} type - Loại thông báo: "success" | "error" | "warning" | "info"
 * @param {string} message - Nội dung thông báo
 * @param {string} title - Tiêu đề (tùy chọn)
 * @param {number} duration - Thời gian hiển thị (ms), mặc định 3000ms
 * @param {function} onClose - Callback khi đóng toast
 */
const Toast = ({ type = "info", message, title, duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  // Icon cho từng loại thông báo
  const icons = {
    success: (
      <svg viewBox="0 0 24 24" className={styles.icon}>
        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    ),
    error: (
      <svg viewBox="0 0 24 24" className={styles.icon}>
        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
    ),
    warning: (
      <svg viewBox="0 0 24 24" className={styles.icon}>
        <path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      </svg>
    ),
    info: (
      <svg viewBox="0 0 24 24" className={styles.icon}>
        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
      </svg>
    ),
  };

  // Tiêu đề mặc định theo loại
  const defaultTitles = {
    success: "Thành công!",
    error: "Lỗi!",
    warning: "Cảnh báo!",
    info: "Thông báo",
  };

  const handleClose = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose && onClose();
    }, 300); // Thời gian animation
  }, [onClose]);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, handleClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`${styles.toast} ${styles[type]} ${isLeaving ? styles.leaving : ""}`}
    >
      <div className={styles.iconWrapper}>{icons[type]}</div>
      <div className={styles.content}>
        <div className={styles.title}>{title || defaultTitles[type]}</div>
        <div className={styles.message}>{message}</div>
      </div>
      <button className={styles.closeBtn} onClick={handleClose}>
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
      <div className={styles.progressBar}>
        <div 
          className={styles.progress} 
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
};

export default Toast;
