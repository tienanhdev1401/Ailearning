import React from "react";
import Toast from "./Toast";
import styles from "./ToastContainer.module.css";

/**
 * Container chứa tất cả Toast notifications
 * Vị trí có thể thay đổi: top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
 */
const ToastContainer = ({ toasts, removeToast, position = "top-right" }) => {
  return (
    <div className={`${styles.container} ${styles[position]}`}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
