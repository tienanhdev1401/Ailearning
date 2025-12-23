import React, { createContext, useContext, useState, useCallback } from "react";
import ToastContainer from "../component/Toast/ToastContainer";
import ConfirmDialog from "../component/Toast/ConfirmDialog";

// Tạo Context
const ToastContext = createContext(null);

// ID tự động tăng
let toastId = 0;

/**
 * ToastProvider - Bọc app để sử dụng toast ở mọi nơi
 * @param {string} position - Vị trí hiển thị: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center"
 */
export const ToastProvider = ({ children, position = "top-right" }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "Xác nhận",
    message: "",
    confirmText: "Xác nhận",
    cancelText: "Hủy",
    type: "warning",
    resolve: null,
  });

  // Thêm toast mới
  const addToast = useCallback((options) => {
    const id = toastId++;
    const newToast = {
      id,
      type: options.type || "info",
      title: options.title,
      message: options.message,
      duration: options.duration ?? 3000,
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  // Xóa toast theo id
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Xóa tất cả toast
  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Hàm confirm trả về Promise
  const showConfirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title: options.title || "Xác nhận",
        message,
        confirmText: options.confirmText || "Xác nhận",
        cancelText: options.cancelText || "Hủy",
        type: options.type || "warning",
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmState.resolve) {
      confirmState.resolve(true);
    }
    setConfirmState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [confirmState]);

  const handleCancel = useCallback(() => {
    if (confirmState.resolve) {
      confirmState.resolve(false);
    }
    setConfirmState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [confirmState]);

  // Các hàm tiện ích
  const toast = {
    // Hiển thị toast thành công
    success: (message, options = {}) =>
      addToast({ type: "success", message, ...options }),

    // Hiển thị toast lỗi
    error: (message, options = {}) =>
      addToast({ type: "error", message, ...options }),

    // Hiển thị toast cảnh báo
    warning: (message, options = {}) =>
      addToast({ type: "warning", message, ...options }),

    // Hiển thị toast thông tin
    info: (message, options = {}) =>
      addToast({ type: "info", message, ...options }),

    // Xóa tất cả
    clear: clearAllToasts,

    // Hiển thị dialog xác nhận (trả về Promise<boolean>)
    confirm: showConfirm,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer
        toasts={toasts}
        removeToast={removeToast}
        position={position}
      />
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        type={confirmState.type}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ToastContext.Provider>
  );
};

/**
 * Hook để sử dụng toast
 * @returns {Object} toast - Object chứa các hàm: success, error, warning, info, clear
 * 
 * @example
 * const toast = useToast();
 * 
 * // Hiển thị thông báo thành công
 * toast.success("Đăng nhập thành công!");
 * 
 * // Hiển thị lỗi với tiêu đề tùy chỉnh
 * toast.error("Sai mật khẩu", { title: "Đăng nhập thất bại" });
 * 
 * // Hiển thị cảnh báo với thời gian tùy chỉnh (5 giây)
 * toast.warning("Phiên đăng nhập sắp hết hạn", { duration: 5000 });
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast phải được sử dụng trong ToastProvider");
  }
  return context;
};

export default ToastContext;
