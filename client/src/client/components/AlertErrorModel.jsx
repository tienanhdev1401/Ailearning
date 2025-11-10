import { createRoot } from "react-dom/client";
import { Modal, Button } from "react-bootstrap";
import { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

// Hàm trả về title, message, màu và icon dựa trên status code
const getErrorInfo = (error) => {
  const status = error?.response?.status;
  const detail = error?.response?.data?.message || error?.message || '';

  switch (status) {
    case 400: return { title: 'Yêu cầu không hợp lệ', message: detail, color: '#ffc107', icon: '⚠️' };
    case 401: return { title: 'Chưa xác thực', message: detail, color: '#0d6efd', icon: '🔒' };
    case 403: return { title: 'Không có quyền', message: detail, color: '#0d6efd', icon: '⛔' };
    case 404: return { title: 'Không tìm thấy dữ liệu', message: detail, color: '#ffc107', icon: '❓' };
    case 500: return { title: 'Lỗi server', message: detail, color: '#dc3545', icon: '💥' };
    default: return { title: 'Lỗi', message: detail || 'Đã xảy ra lỗi', color: '#6c757d', icon: 'ℹ️' };
  }
};

// Component modal hiển thị lỗi
const ErrorModal = ({ error, onClose, autoClose = 4000 }) => {
  const [show, setShow] = useState(true);
  const { title, message, color, icon } = getErrorInfo(error);

  useEffect(() => {
    if (!autoClose) return;
    const timer = setTimeout(() => setShow(false), autoClose);
    return () => clearTimeout(timer);
  }, [autoClose]);

  const handleExited = () => onClose();

  return (
    <Modal
      show={show}
      onHide={() => setShow(false)}
      onExited={handleExited}
      centered
      backdrop="static"
      keyboard={false}
      animation
      contentClassName="border-0 shadow"
    >
      <Modal.Header closeButton style={{ borderBottom: 'none' }} />
      <Modal.Body style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '3rem', color, marginBottom: '0.5rem' }}>{icon}</div>
        <h5 style={{ fontWeight: '600', marginBottom: '1rem' }}>{title}</h5>
        <p style={{ fontSize: '1.1rem' }}>{message}</p>
        <Button
          variant="light"
          onClick={() => setShow(false)}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1.5rem',
            borderRadius: '0.5rem',
            borderColor: color,
            color
          }}
        >
          Đóng
        </Button>
      </Modal.Body>
    </Modal>
  );
};

// Hàm show error alert từ bất cứ nơi nào
export const showErrorAlert = (error, autoClose = 4000) => {
  const container = document.createElement("div");
  document.body.appendChild(container);

  const root = createRoot(container);

  const handleClose = () => {
    root.unmount();
    container.remove();
  };

  root.render(<ErrorModal error={error} onClose={handleClose} autoClose={autoClose} />);
};
