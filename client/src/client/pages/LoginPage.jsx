import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import styles from '../styles/LoginPage.module.css';
import { Modal, Button } from 'react-bootstrap';
import USER_ROLE from '../../enums/userRole.enum';
import { jwtDecode } from 'jwt-decode';

const EYE_OPEN_ICON = '/assets/img/icon/eye-close-up-svgrepo-com.svg';
const EYE_CLOSED_ICON = '/assets/img/icon/eye-close-svgrepo-com.svg';

const LabeledInput = ({ id, label, className = styles.fieldInput, ...rest }) => (
  <>
    <label className={styles.fieldLabel} htmlFor={id}>{label}</label>
    <input id={id} className={className} {...rest} />
  </>
);

const PasswordField = ({ id, label, value, onChange, showPassword, toggleVisibility, autoComplete, minLength }) => (
  <>
    <label className={styles.fieldLabel} htmlFor={id}>{label}</label>
    <div className={styles.passwordField}>
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        placeholder="••••••"
        value={value}
        onChange={onChange}
        required
        minLength={minLength ?? undefined}
        autoComplete={autoComplete}
        className={styles.fieldInput}
      />
      <button
        type="button"
        className={styles.eyeButton}
        onClick={toggleVisibility}
        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      >
        <img src={showPassword ? EYE_CLOSED_ICON : EYE_OPEN_ICON} alt={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} />
      </button>
    </div>
  </>
);

const LoginPage = () => {
  const navigate = useNavigate();

  const [isSignIn, setIsSignIn] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(60);

  const clearForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setOtp(Array(6).fill(''));
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError('');
    setOtpCountdown(60);
  };

  const showSignIn = () => { clearForm(); setIsSignIn(true); };
  const showSignUp = () => { clearForm(); setIsSignIn(false); };
  const togglePasswordVisibility = () => setShowPassword(prev => !prev);

  // -------- LOGIN --------
  const login = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('accessToken', res.data.accessToken);
      const decoded = jwtDecode(res.data.accessToken);
      const role = decoded.role;
      if (role === USER_ROLE.ADMIN || role === USER_ROLE.STAFF) navigate('/dashboard');
      else navigate('/');
    } catch {
      alert('Login failed');
    }
  };

  // -------- SIGN UP --------
  const signUp = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu và xác nhận mật khẩu không khớp.');
      return;
    }

    try {
      setIsSendingOtp(true);
      await api.post('/auth/send-verification-code', { email });
      setShowOtpModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // -------- OTP HANDLERS --------
  const handleChangeOtp = (value, index) => {
    if (/^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      alert('Vui lòng nhập đủ 6 chữ số OTP!');
      return;
    }

    try {
      setIsVerifyingOtp(true);
      await api.post('/auth/register', { name: fullName, email, password, otp: code });
      alert('✅ Đăng ký thành công! Hãy đăng nhập.');
      setShowOtpModal(false);
      setIsSignIn(true);
      clearForm();
    } catch (err) {
      alert(err.response?.data?.message || '❌ OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // -------- OTP COUNTDOWN --------
  useEffect(() => {
    if (!showOtpModal) return;

    setOtpCountdown(60); // reset 60s
    const timer = setInterval(() => {
      setOtpCountdown(prev => {
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
        <div className={styles.leftPane}>
          <div className={styles.leftCopy}>
            <span className={styles.badge}>💡 Trải nghiệm học thông minh</span>
            <h1 className={styles.heroHeading}>
              <span className={styles.heroHeadingLine}>Học Tiếng Anh</span>
              <span className={styles.heroHeadingLine}>cùng <span className={styles.brandHighlight}>AelanG</span></span>
            </h1>
            <p className={styles.heroDescription}>
              Luyện nghe, nói, đọc, viết với AI. Theo dõi tiến độ, nhiệm vụ hàng ngày, và mở khóa phần thưởng khi duy trì streak!
            </p>
          </div>
          <div className={styles.illustrationHolder}>
            <img src="/assets/img/hero/hero1.png" alt="Học tiếng Anh cùng AelanG" className={styles.illustration} />
          </div>
        </div>

        <div className={styles.rightPane}>
          <div className={styles.tabHeader}>
            <button type="button" className={`${styles.tabButton} ${isSignIn ? styles.activeTab : ''}`} onClick={showSignIn}>Đăng Nhập</button>
            <button type="button" className={`${styles.tabButton} ${!isSignIn ? styles.activeTab : ''}`} onClick={showSignUp}>Đăng Ký</button>
          </div>

          <div className={styles.formArea}>
            {!isSignIn && (
              <form className={styles.form} onSubmit={signUp}>
                {error && <div className={styles.errorBox}>{error}</div>}
                <LabeledInput id="signup-name" label="Họ và tên" type="text" placeholder="Nhập đầy đủ tên" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
                <LabeledInput id="signup-email" label="Email" type="email" placeholder="Email của bạn ở đây" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                <PasswordField id="signup-password" label="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} showPassword={showPassword} toggleVisibility={togglePasswordVisibility} autoComplete="new-password" minLength={6} />
                <PasswordField id="signup-confirm-password" label="Xác nhận mật khẩu" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} showPassword={showConfirmPassword} toggleVisibility={() => setShowConfirmPassword(prev => !prev)} autoComplete="new-password" minLength={6} />
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={() => setAgreeTerms((prev) => !prev)}
                    required
                  />
                  <span>
                    Tôi đồng ý với <span className={styles.link}>điều khoản dịch vụ</span>
                  </span>
                </label>
                <button type="submit" className={styles.primaryButton} disabled={isSendingOtp}>
                  {isSendingOtp && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
                  Đăng Ký
                </button>
              </form>
            )}

            {isSignIn && (
              <form className={styles.form} onSubmit={login}>
                <LabeledInput id="signin-email" label="Email" type="email" placeholder="Email của bạn ở đây" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                <PasswordField id="signin-password" label="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} showPassword={showPassword} toggleVisibility={togglePasswordVisibility} autoComplete="current-password" />
                <div className={styles.formFooter}>
                  <label className={styles.checkboxRow}>
                    <input type="checkbox" />
                    <span>Ghi nhớ tôi</span>
                  </label>
                  <span
                    className={styles.link}
                    onClick={() => navigate('/forgot-password')}
                  >
                    Quên mật khẩu?
                  </span>
                </div>
                <button type="submit" className={styles.primaryButton}>Đăng Nhập</button>
              </form>
            )}
          </div>
        </div>
      </div>

      <Modal show={showOtpModal} onHide={() => setShowOtpModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Nhập mã OTP</Modal.Title></Modal.Header>
        <Modal.Body>
          <p>Nhập 6 chữ số OTP đã được gửi tới email: <b>{email}</b></p>
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
                style={{ width: "45px", height: "45px", fontSize: "20px", borderRadius: "10px" }}
                disabled={otpCountdown === 0}
              />
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOtpModal(false)}>Hủy</Button>
          <Button variant="primary" onClick={handleVerifyOtp} disabled={isVerifyingOtp || otpCountdown === 0}>
            {isVerifyingOtp && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default LoginPage;
