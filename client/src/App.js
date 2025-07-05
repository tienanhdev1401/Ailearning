import React, { useEffect, useState, useCallback } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import SignInPage from "./pages/SignInPage"
import ProtectedRoute from "./components/ProtectedRoute";
import api, { setAccessToken as setGlobalAccessToken } from "./api/api";
import { useAuth } from "./context/AuthContext";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, setAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);

  const handleLoginSuccess = useCallback((token) => {
    setAccessToken(token);
    setGlobalAccessToken(token);
  }, [setAccessToken]);

  useEffect(() => {
    const publicRoutes = ["/login", "/signin"];

    // Nếu là route không cần xác thực, dừng kiểm tra
    if (publicRoutes.includes(location.pathname)) {
      setLoading(false);
      return;
    }

    const checkLogin = async () => {
      if (accessToken) {
        setGlobalAccessToken(accessToken);
        setLoading(false);
        return;
      }

      try {
        const res = await api.post("/auth/refresh");
        console.log('acess token khi F5',res.data.accessToken);
        handleLoginSuccess(res.data.accessToken);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate("/login");
        } else {
          console.error("Lỗi khi refresh:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    checkLogin();
  }, [accessToken, navigate, handleLoginSuccess, location.pathname]);

  if (loading) return <div>Loading...</div>;

  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute accessToken={accessToken}>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signin" element={<SignInPage />} />
    </Routes>
  );
}

export default App;
