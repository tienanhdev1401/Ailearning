import { createContext, useContext, useEffect,useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api"; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const navigate = useNavigate();

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
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        navigate('/login'); // dùng navigate
      }
    }
  }, 10 * 60 * 1000); // 10 phút

  return () => clearInterval(interval);
}, [accessToken, navigate]);

  return (
    <AuthContext.Provider value={{ accessToken, setAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
