import '../styles/Home.css';
import api from '../../api/api';
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  // const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  
  const logout = async () => {
    await api.post("/auth/logout");
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  // useEffect(() => {
  //   fetchUsers();
  // }, []);

  
  return (
    <div className="layout">
      <main className="main" role="main">
        {/* Nội dung bài học sẽ hiển thị ở đây */}
        <h1>Chào mừng bạn đến với AelanG!</h1>
        <button onClick={logout}>Đăng xuất</button>
      </main>
    </div>
  );
};

export default HomePage;