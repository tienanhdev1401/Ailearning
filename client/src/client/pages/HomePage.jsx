import React from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";

// import CSS module
import styles from "../styles/Home.module.css";

const HomePage = () => {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await api.post("/auth/logout");
      localStorage.removeItem("accessToken");
      navigate("/login");
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    }
  };

  return (
    <div className={styles.mainHome}>
      <h1>Chào mừng bạn đến với AelanG!</h1>
      <button onClick={logout}>Đăng xuất</button>
    </div>
    );

};

export default HomePage;
