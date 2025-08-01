import Sidebar from "./Sidebar";
import '../styles/Home.css'; // vẫn dùng chung class layout và main

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main" role="main">
        {children}
      </main>
    </div>
  );
};

export default Layout;
