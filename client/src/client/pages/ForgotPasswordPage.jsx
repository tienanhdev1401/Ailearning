import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import api from "../../api/api";
import styles from "../styles/LoginPage.module.css";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";

// Icon mắt
const EYE_OPEN_ICON = "/assets/img/icon/eye-close-up-svgrepo-com.svg";
const EYE_CLOSED_ICON = "/assets/img/icon/eye-close-svgrepo-com.svg";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(60);

  const navigate = useNavigate();
  const toast = useToast();

  const clearForm = () => {
    setOtp(Array(6).fill(""));
    setOtpCountdown(60);
  };

  // Gửi OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.warning("Mật khẩu mới và xác nhận mật khẩu không khớp!");
      return;
    }

    try {
      setIsSendingOtp(true);
      await api.post("/auth/send-verification-code", { email });
      setShowOtpModal(true);
      clearForm();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể gửi OTP.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Xử lý nhập OTP từng ô
  const handleChangeOtp = (value, index) => {
    if (/^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`).focus();
      }
    }
  };

  // Xác thực OTP + reset password
  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      toast.warning("Vui lòng nhập đủ 6 chữ số OTP!");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      await api.post("/auth/reset-password", {
        email,
        otp: code,
        newPassword,
      });
      toast.success("Đặt lại mật khẩu thành công! Hãy đăng nhập lại.");
      setShowOtpModal(false);
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "OTP không hợp lệ hoặc đã hết hạn.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // -------- OTP COUNTDOWN --------
  useEffect(() => {
    if (!showOtpModal) return;

    setOtpCountdown(60); // reset 60s
    const timer = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showOtpModal]);

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        {/* Cột trái */}
        <div className={styles.leftPane}>
          <div className={styles.leftCopy}>
            <h1 className={styles.heroHeading}>
              <span className={styles.heroHeadingLine}>Quên mật khẩu?</span>
            </h1>
            <p className={styles.heroDescription}>
              Nhập email và mật khẩu mới, sau đó xác nhận bằng mã OTP được gửi đến email của bạn.
            </p>
          </div>
          <div className={styles.illustrationHolder}>
            <img
              src="/assets/img/hero/hero1.png"
              alt="Quên mật khẩu"
              className={styles.illustration}
            />
          </div>
        </div>

        {/* Cột phải */}
        <div className={styles.rightPane}>
          <h3 className="text-center text-dark fw-bold">Đặt lại mật khẩu</h3>
          <form className={styles.form} onSubmit={handleSendOtp}>
            <label className={styles.fieldLabel} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.fieldInput}
            />

            <label className={styles.fieldLabel} htmlFor="newPassword">
              Mật khẩu mới
            </label>
            <div className={styles.passwordField}>
              <input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className={styles.fieldInput}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowNewPassword((prev) => !prev)}
              >
                <img
                  src={showNewPassword ? EYE_CLOSED_ICON : EYE_OPEN_ICON}
                  alt={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                />
              </button>
            </div>

            <label className={styles.fieldLabel} htmlFor="confirmPassword">
              Xác nhận mật khẩu mới
            </label>
            <div className={styles.passwordField}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className={styles.fieldInput}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                <img
                  src={showConfirmPassword ? EYE_CLOSED_ICON : EYE_OPEN_ICON}
                  alt={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                />
              </button>
            </div>

            <button type="submit" className={styles.primaryButton} disabled={isSendingOtp}>
              {isSendingOtp && (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              )}
              Đặt lại mật khẩu
            </button>
          </form>

          <div className="text-center mt-3">
            <span
              className={styles.link}
              onClick={() => navigate("/login")}
              style={{ cursor: "pointer" }}
            >
              ← Quay lại đăng nhập
            </span>
          </div>
        </div>
      </div>

      {/* POPUP OTP */}
      <Modal show={showOtpModal} onHide={() => setShowOtpModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Nhập mã OTP</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Nhập 6 chữ số OTP đã được gửi tới email: <b>{email}</b>
          </p>
          <p>Thời gian còn lại: <b>{otpCountdown}s</b></p>
          <div className="d-flex justify-content-center gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChangeOtp(e.target.value, index)}
                className="form-control text-center"
                style={{
                  width: "45px",
                  height: "45px",
                  fontSize: "20px",
                  borderRadius: "10px",
                }}
                disabled={otpCountdown === 0}
              />
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOtpModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleVerifyOtp} disabled={isVerifyingOtp || otpCountdown === 0}>
            {isVerifyingOtp && (
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            )}
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ForgotPasswordPage;
