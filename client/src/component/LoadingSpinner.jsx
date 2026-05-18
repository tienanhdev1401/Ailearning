import React from "react";
import "../styles/LoadingSpinner.css";

/**
 * Unified loading component — dùng chung cho toàn bộ ứng dụng.
 *
 * Props:
 *  - variant   : "ring" (default) | "dots"
 *  - size      : "sm" | "md" (default) | "lg"
 *  - inline    : boolean — nếu true thì KHÔNG chiếm full viewport
 *  - text      : string  — dòng chữ hiển thị bên dưới spinner (mặc định: "Đang tải...")
 *  - className : string  — thêm class tùy ý
 */
const LoadingSpinner = ({
  variant = "ring",
  size = "md",
  inline = false,
  text = "Đang tải...",
  className = "",
}) => {
  const sizeClass =
    size === "sm"
      ? "loading-spinner--sm"
      : size === "lg"
        ? "loading-spinner--lg"
        : "";

  const containerClasses = [
    "loading-spinner-container",
    sizeClass,
    inline ? "loading-spinner--inline" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClasses}>
      {variant === "dots" ? (
        <div className="loading-spinner-dots">
          <span />
          <span />
          <span />
        </div>
      ) : (
        <div className="loading-spinner-ring">
          <div className="loading-spinner-ring-dot" />
        </div>
      )}

      {text && <p className="loading-spinner-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
