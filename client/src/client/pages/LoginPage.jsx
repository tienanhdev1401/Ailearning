import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import USER_ROLE from '../../enums/userRole.enum';
import { jwtDecode } from "jwt-decode";
import styles from '../styles/LoginPage.module.css'; // import module CSS

const LoginPage = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("accessToken", res.data.accessToken);
      const decoded = jwtDecode(res.data.accessToken);
      const role = decoded.role;

      if (role === USER_ROLE.ADMIN || role === USER_ROLE.STAFF) {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    } catch {
      alert("Login failed");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromGoogle = params.get("accessToken");
    if (tokenFromGoogle) {
      localStorage.setItem("accessToken", tokenFromGoogle);
      const decoded = jwtDecode(tokenFromGoogle);
      const role = decoded.role;

      if (role === USER_ROLE.ADMIN || role === USER_ROLE.STAFF) {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    }
  }, [navigate]);

  const signUp = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/register", {
        name: fullName,
        email,
        password
      });
      alert("Đăng ký thành công! Hãy đăng nhập.");
      setIsSignIn(true);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  const clearForm = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setAgreeTerms(false);
    setError("");
  };

  const showSignIn = () => { clearForm(); setIsSignIn(true); };
  const showSignUp = () => { clearForm(); setIsSignIn(false); };
  const toggleForms = () => setIsSignIn(!isSignIn);
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className={styles["sign-up-page"]}>
      <div className={styles["sign-up-container"]}>
        {/* Left */}
        <div className={styles["sign-up-left"]}>
          <p className={styles["sign-up-text"]}>
            Plan your activities and control your progress online
          </p>
          <img
            src="https://storage.googleapis.com/a1aa/image/4f77d6a1-681c-4969-310d-dee69346c699.jpg"
            alt="Rocket"
            className={styles["sign-up-image"]}
          />
          <div className={styles["sign-up-dots"]}>
            <span className={styles["sign-up-dot"]}></span>
            <span className={styles["sign-up-dot"]}></span>
            <span className={`${styles["sign-up-dot"]} ${styles.active}`}></span>
            <span className={styles["sign-up-dot"]}></span>
          </div>
        </div>

        {/* Right */}
        <div className={styles["sign-up-right"]}>
          <div className={styles["sign-up-tabs"]}>
            <button
              className={`${styles["sign-up-tab"]} ${isSignIn ? styles.active : ''}`}
              onClick={showSignIn}
            >
              Sign In
            </button>
            <button
              className={`${styles["sign-up-tab"]} ${!isSignIn ? styles.active : ''}`}
              onClick={showSignUp}
            >
              Sign Up
            </button>
          </div>

          <div className={styles["sign-up-switch"]}>
            <span>{isSignIn ? 'Sign Up' : 'Sign In'}</span>
            <span> or </span>
            <span className={styles["sign-up-link"]} onClick={toggleForms}>
              {isSignIn ? 'Sign In' : 'Sign Up'}
            </span>
          </div>

          <div className={styles["sign-up-forms"]}>
            {/* Sign Up Form */}
            <form
              className={`${styles["sign-up-form"]} ${!isSignIn ? styles.visible : ''}`}
              onSubmit={signUp}
            >
              {error && <div className={styles["sign-up-error"]}>{error}</div>}

              <label>FULL NAME</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />

              <label>E-MAIL</label>
              <input
                type="email"
                placeholder="Your email goes here"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />

              <label>PASSWORD</label>
              <div className={styles["sign-up-password-container"]}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength="6"
                />
                <i
                  className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                  onClick={togglePasswordVisibility}
                ></i>
              </div>

              <div className={styles["sign-up-checkbox"]}>
                <input 
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={() => setAgreeTerms(!agreeTerms)}
                />
                <label>I agree to <span className={styles["sign-up-link"]}>terms of service</span></label>
              </div>

              <button type="submit" className={styles["sign-up-submit"]}>Sign Up</button>
            </form>

            {/* Sign In Form */}
            <form
              className={`${styles["sign-up-form"]} ${isSignIn ? styles.visible : ''}`}
              onSubmit={login}
            >
              <label>E-MAIL</label>
              <input
                type="email"
                placeholder="Your email goes here"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />

              <label>PASSWORD</label>
              <div className={styles["sign-up-password-container"]}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <i
                  className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                  onClick={togglePasswordVisibility}
                ></i>
              </div>

              <div className={styles["sign-up-options"]}>
                <div>
                  <input type="checkbox" />
                  <label>Remember me</label>
                </div>
                <span
                  className={styles["sign-up-link"]}
                  onClick={() => navigate('/forget-password')}
                  style={{ cursor: 'pointer' }}
                >
                  Forgot password?
                </span>
              </div>

              <button type="submit" className={styles["sign-up-submit"]}>Sign In</button>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <p style={{ marginBottom: '0.5rem' }}>Hoặc đăng nhập bằng</p>
                <a
                  href="http://localhost:5000/api/auth/google"
                  className={styles["google-login-btn"]}
                  style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    backgroundColor: '#4285F4',
                    color: '#fff',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    fontWeight: 'bold'
                  }}
                >
                  Google
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
