import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { useToast } from "./ToastContext";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    if (storedToken) {
      setAccessToken(storedToken);
    }
  }, []);

   // Auto refresh token mỗi 10 phút
  useEffect(() => {
  if (!accessToken) return;

  const interval = setInterval(async () => {
    try {
      const res = await api.post('/auth/refresh'); // Cookie HttpOnly tự gửi
      setAccessToken(res.data.accessToken);       // Cập nhật token mới
      console.log('AUTO refresh token');
    } catch (err) {
      if (err.response?.status === 401) {
        setAccessToken(null);
        toast.warning("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        navigate('/login'); // dùng navigate
      }
    }
  }, 10 * 60 * 1000); // 10 phút

  return () => clearInterval(interval);
}, [accessToken, navigate, toast]);

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    } else {
      localStorage.removeItem("accessToken");
    }
  }, [accessToken]);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Không thể gọi API logout", err);
    } finally {
      // Xóa access token khỏi localStorage
      localStorage.removeItem("accessToken");

      // Đặt state về null 
      setAccessToken(null);
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ accessToken, setAccessToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
