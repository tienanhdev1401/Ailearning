import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import React, { useState} from "react";
import api from "../api/api";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setAccessToken } = useAuth();
  const navigate = useNavigate();

  const login = async () => {
    try {
      const res = await api.post("/auth/login", { email, password });
      setAccessToken(res.data.accessToken);
      console.log("access token lúc login", res.data.accessToken);
      navigate("/");
    } catch {
      alert("Đăng nhập thất bại");
    }
  };
  return (
    <div>
      <h2>Đăng nhập</h2>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
      <input type="password" placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} required />
      <button onClick={login}>Đăng nhập</button>

    </div>
      

  );
};

export default LoginPage;
