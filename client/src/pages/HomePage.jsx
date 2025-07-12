import '../styles/Home.css';
import Sidebar from '../components/Sidebar';
import React from "react";
import api, { setAccessToken as unsetGlobalToken } from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; 

const HomePage = () => {
  // const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const { setAccessToken } = useAuth(); 

  // const fetchUsers = async () => {
  //   try {
  //     const res = await api.get("/users");
  //     setUsers(res.data);
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  const logout = async () => {
    await api.post("/auth/logout");
    unsetGlobalToken(null);
    setAccessToken(null);
    navigate("/login");
  };

  // useEffect(() => {
  //   fetchUsers();
  // }, []);

  
  return (
    <div className="layout">
      <Sidebar />
      <main className="main" role="main">
        {/* Nội dung bài học sẽ hiển thị ở đây */}
        <h1>Chào mừng bạn đến với AelanG!</h1>
        <button onClick={logout}>Đăng xuất</button>
      </main>
    </div>
  );
};

export default HomePage;