import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import USER_ROLE from '../../enums/userRole.enum';
import { jwtDecode } from 'jwt-decode';
import styles from '../styles/LoginPage.module.css';

const EYE_OPEN_ICON = '/assets/img/icon/eye-close-up-svgrepo-com.svg';
const EYE_CLOSED_ICON = '/assets/img/icon/eye-close-svgrepo-com.svg';

const LabeledInput = ({ id, label, className = styles.fieldInput, ...rest }) => (
  <>
    <label className={styles.fieldLabel} htmlFor={id}>
      {label}
    </label>
    <input id={id} className={className} {...rest} />
  </>
);

const PasswordField = ({
  id,
  label,
  value,
  onChange,
  showPassword,
  toggleVisibility,
  autoComplete,
  minLength,
}) => (
  <>
    <label className={styles.fieldLabel} htmlFor={id}>
      {label}
    </label>
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
        <img
          src={showPassword ? EYE_CLOSED_ICON : EYE_OPEN_ICON}
          alt={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        />
      </button>
    </div>
  </>
);

const LoginPage = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('accessToken', res.data.accessToken);

      // Kiểm tra lần đầu xác nhận muticheck sau khi đăng nhập bằng Google
      const firstConfirm = await checkFirstConfirm(res.data.accessToken, navigate);
    if (firstConfirm) return;

      const decoded = jwtDecode(res.data.accessToken);
      const role = decoded.role;

      if (role === USER_ROLE.ADMIN || role === USER_ROLE.STAFF) {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch {
      alert('Login failed');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromGoogle = params.get('accessToken');
    // if (tokenFromGoogle) {
    //   localStorage.setItem('accessToken', tokenFromGoogle);
    //   const decoded = jwtDecode(tokenFromGoogle);
    //   const role = decoded.role;

    //   if (role === USER_ROLE.ADMIN || role === USER_ROLE.STAFF) {
    //     navigate('/dashboard');
    //   } else {
    //     navigate('/');
    //   }
    // }

    // Kiểm tra lần đầu xác nhận muticheck sau khi đăng nhập bằng Google
    if (tokenFromGoogle) {
      localStorage.setItem('accessToken', tokenFromGoogle);
      checkFirstConfirm(tokenFromGoogle, navigate).then((redirected) => {
        if (!redirected) {
          const decoded = jwtDecode(tokenFromGoogle);
          const role = decoded.role;
          if (role === USER_ROLE.ADMIN || role === USER_ROLE.STAFF) {
            navigate('/dashboard');
          } else {
            navigate('/');
          }
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const signUp = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Mật khẩu và xác nhận mật khẩu không khớp.');
      return;
    }
    try {
      await api.post('/auth/register', {
        name: fullName,
        email,
        password,
      });
      alert('Đăng ký thành công! Hãy đăng nhập.');
      setIsSignIn(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  const clearForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setAgreeTerms(false);
    setError('');
  };

  const showSignIn = () => {
    clearForm();
    setIsSignIn(true);
  };

  const showSignUp = () => {
    clearForm();
    setIsSignIn(false);
  };

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  async function checkFirstConfirm(accessToken,navigate) {
    try {
      
      const res = await api.get('/confirm/check', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const firstConfirm = !res.data.completed;
      console.log('First confirm status:', firstConfirm);
      if (firstConfirm) {
        navigate('/welcome/reason');
        return true;
      }
    } catch (err) {
      console.error('Error checking first confirm:', err);
    }
    return false;
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <div className={styles.leftPane}>
          <div className={styles.leftCopy}>
            <span className={styles.badge}>💡 Trải nghiệm học thông minh</span>
            <h1 className={styles.heroHeading}>
              <span className={styles.heroHeadingLine}>Học Tiếng Anh</span>
              <span className={styles.heroHeadingLine}>
                cùng <span className={styles.brandHighlight}>AelanG</span>
              </span>
            </h1>
            <p className={styles.heroDescription}>
              Luyện nghe, nói, đọc, viết với AI. Theo dõi tiến độ, nhiệm vụ hàng ngày,
              và mở khóa phần thưởng khi duy trì streak!
            </p>
          </div>
          <div className={styles.illustrationHolder}>
            <img
              src="/assets/img/hero/hero1.png"
              alt="Học tiếng Anh cùng AelanG"
              className={styles.illustration}
            />
          </div>
        </div>

        <div className={styles.rightPane}>
          <div className={styles.tabHeader}>
            <button
              type="button"
              className={`${styles.tabButton} ${isSignIn ? styles.activeTab : ''}`}
              onClick={showSignIn}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${!isSignIn ? styles.activeTab : ''}`}
              onClick={showSignUp}
            >
              Đăng Ký
            </button>
          </div>

          <div className={styles.formArea}>
            {!isSignIn && (
              <form className={styles.form} onSubmit={signUp}>
                {error && <div className={styles.errorBox}>{error}</div>}

                <LabeledInput
                  id="signup-name"
                  label="Họ và tên"
                  type="text"
                  placeholder="Nhập đầy đủ tên"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                />

                <LabeledInput
                  id="signup-email"
                  label="Email"
                  type="email"
                  placeholder="Email của bạn ở đây"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />

                <PasswordField
                  id="signup-password"
                  label="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  showPassword={showPassword}
                  toggleVisibility={togglePasswordVisibility}
                  autoComplete="new-password"
                  minLength={6}
                />

                <PasswordField
                  id="signup-confirm-password"
                  label="Xác nhận mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  showPassword={showConfirmPassword}
                  toggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
                  autoComplete="new-password"
                  minLength={6}
                />

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

                <button type="submit" className={styles.primaryButton}>
                  Đăng Ký
                </button>
              </form>
            )}

            {isSignIn && (
              <form className={styles.form} onSubmit={login}>
                <LabeledInput
                  id="signin-email"
                  label="Email"
                  type="email"
                  placeholder="Email của bạn ở đây"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />

                <PasswordField
                  id="signin-password"
                  label="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  showPassword={showPassword}
                  toggleVisibility={togglePasswordVisibility}
                  autoComplete="current-password"
                />

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

                <button type="submit" className={styles.primaryButton}>
                  Đăng Nhập
                </button>
              </form>
            )}
          </div>

          <div className={styles.googleArea}>
            <span className={styles.dividerText}>Hoặc</span>
            <a
              href="http://localhost:5000/api/auth/google"
              className={styles.googleButton}
            >
              <span className={styles.googleIcon}>G</span>
              <span>Đăng nhập với Google</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
