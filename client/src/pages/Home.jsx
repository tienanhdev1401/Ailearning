import React from 'react';
import '../styles/Home.css';
import Sidebar from '../components/Sidebar';

const Home = () => {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main" role="main">
        {/* Nội dung bài học sẽ hiển thị ở đây */}
        <h1>Chào mừng bạn đến với AelanG!</h1>
      </main>
    </div>
  );
};

export default Home;