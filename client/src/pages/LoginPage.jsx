import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import '../styles/LoginPage.css';

const LoginPage = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // Login bằng JWT
  const login = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("accessToken", res.data.accessToken);
      navigate("/");
    } catch {
      alert("Login failed");
    }
  };

  // Login bằng Google
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromGoogle = params.get("accessToken");
    if (tokenFromGoogle) {
      localStorage.setItem("accessToken", tokenFromGoogle);
      navigate("/");
    }
  }, [navigate]);

  // Đăng ký
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

  const showSignIn = () => {
    clearForm();
    setIsSignIn(true);
  };
  
  const showSignUp = () => {
    clearForm();
    setIsSignIn(false);
  };
  const toggleForms = () => setIsSignIn(!isSignIn);
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="sign-up-page">
      <div className="sign-up-container">
        {/* Left */}
        <div className="sign-up-left">
          <p className="sign-up-text">Plan your activities and control your progress online</p>
          <img
            src="https://storage.googleapis.com/a1aa/image/4f77d6a1-681c-4969-310d-dee69346c699.jpg"
            alt="Rocket"
            className="sign-up-image"
          />
          <div className="sign-up-dots">
            <span className="sign-up-dot"></span>
            <span className="sign-up-dot"></span>
            <span className="sign-up-dot active"></span>
            <span className="sign-up-dot"></span>
          </div>
        </div>

        {/* Right */}
        <div className="sign-up-right">
          <div className="sign-up-tabs">
            <button className={`sign-up-tab ${isSignIn ? 'active' : ''}`} onClick={showSignIn}>Sign In</button>
            <button className={`sign-up-tab ${!isSignIn ? 'active' : ''}`} onClick={showSignUp}>Sign Up</button>
          </div>

          <div className="sign-up-switch">
            <span>{isSignIn ? 'Sign Up' : 'Sign In'}</span>
            <span> or </span>
            <span className="sign-up-link" onClick={toggleForms}>
              {isSignIn ? 'Sign In' : 'Sign Up'}
            </span>
          </div>

          <div className="sign-up-forms">
            {/* --- Sign Up Form --- */}
            <form className={`sign-up-form ${!isSignIn ? 'visible' : ''}`} onSubmit={signUp}>
              {error && <div className="sign-up-error">{error}</div>}
              
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
              <div className="sign-up-password-container">
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

              <div className="sign-up-checkbox">
                <input 
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={() => setAgreeTerms(!agreeTerms)}
                />
                <label>I agree to <span className="sign-up-link">terms of service</span></label>
              </div>

              <button 
                type="submit" 
                className="sign-up-submit"
              >
                Sign Up
              </button>
            </form>

            {/* --- Sign In Form --- */}
            <form className={`sign-up-form ${isSignIn ? 'visible' : ''}`} onSubmit={login}>
              <label>E-MAIL</label>
              <input
                type="email"
                placeholder="Your email goes here"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />

              <label>PASSWORD</label>
              <div className="sign-up-password-container">
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

              <div className="sign-up-options">
                <div>
                  <input type="checkbox" />
                  <label>Remember me</label>
                </div>
                <span
                  className="sign-up-link"
                  onClick={() => navigate('/forget-password')}
                  style={{ cursor: 'pointer' }}
                >
                  Forgot password?
                </span>
              </div>

              <button type="submit" className="sign-up-submit">Sign In</button>
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <p style={{ marginBottom: '0.5rem' }}>Hoặc đăng nhập bằng</p>
                <a
                  href="http://localhost:5000/api/auth/google"
                  className="google-login-btn"
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