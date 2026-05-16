import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import '../styles/AlertErrorModel.css';

// SVG Icons for different status codes
const WarningIcon = ({ color }) => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 8V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 16.01L12.01 15.9989" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.29 3.86L1.82 18C1.64539 18.3024 1.55299 18.6453 1.55201 18.9945C1.55103 19.3437 1.64151 19.6871 1.81442 19.9899C1.98734 20.2928 2.23611 20.545 2.53592 20.7212C2.83573 20.8974 3.17513 20.9912 3.52 20.99H20.48C20.8249 20.9912 21.1643 20.8974 21.4641 20.7212C21.7639 20.545 22.0127 20.2928 22.1856 19.9899C22.3585 19.6871 22.449 19.3437 22.448 18.9945C22.447 18.6453 22.3546 18.3024 22.18 18L13.71 3.86C13.5317 3.56611 13.2807 3.32312 12.9812 3.15449C12.6817 2.98585 12.3438 2.89722 12 2.89722C11.6562 2.89722 11.3183 2.98585 11.0188 3.15449C10.7193 3.32312 10.4683 3.56611 10.29 3.86V3.86Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LockIcon = ({ color }) => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ErrorIcon = ({ color }) => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 9L9 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 9L15 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const getErrorInfo = (error) => {
  const status = error?.response?.status;
  const detail = error?.response?.data?.message || error?.message || '';

  switch (status) {
    case 400: return { title: 'Yêu cầu không hợp lệ', message: detail, color: '#ffb300', icon: <WarningIcon color="#ffb300" /> };
    case 401: return { title: 'Chưa xác thực', message: detail, color: '#2962ff', icon: <LockIcon color="#2962ff" /> };
    case 403: return { title: 'Không có quyền', message: detail, color: '#f44336', icon: <LockIcon color="#f44336" /> };
    case 404: return { title: 'Không tìm thấy', message: detail, color: '#ffb300', icon: <WarningIcon color="#ffb300" /> };
    case 500: return { title: 'Lỗi máy chủ', message: detail, color: '#d32f2f', icon: <ErrorIcon color="#d32f2f" /> };
    default: return { title: 'Đã có lỗi xảy ra', message: detail || 'Vui lòng thử lại sau', color: '#757575', icon: <WarningIcon color="#757575" /> };
  }
};

const ErrorModal = ({ error, onClose, autoClose = 5000 }) => {
  const [isExiting, setIsExiting] = useState(false);
  const { title, message, color, icon } = getErrorInfo(error);

  useEffect(() => {
    if (!autoClose) return;
    const timer = setTimeout(() => handleClose(), autoClose);
    return () => clearTimeout(timer);
  }, [autoClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300); // Match animation duration
  };

  return (
    <div className={`modalOverlay ${isExiting ? 'fadeOut' : ''}`} onClick={handleClose}>
      <div 
        className={`modalContent ${isExiting ? 'scaleOut' : ''}`} 
        onClick={e => e.stopPropagation()}
        style={{ '--accent-color': color }}
      >
        <button className="closeIcon" onClick={handleClose} aria-label="Close">&times;</button>
        <div className="iconWrapper">
          {icon}
        </div>
        <h2 className="title">{title}</h2>
        <p className="message">{message}</p>
        <button 
          className="closeButton" 
          onClick={handleClose}
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

export const showErrorAlert = (error, autoClose = 5000) => {
  const container = document.createElement("div");
  container.id = "error-alert-container";
  document.body.appendChild(container);

  const root = createRoot(container);

  const handleClose = () => {
    root.unmount();
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  };

  root.render(<ErrorModal error={error} onClose={handleClose} autoClose={autoClose} />);
};
