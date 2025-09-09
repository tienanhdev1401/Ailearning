import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Sidebar.module.css'; // import CSS module

const Sidebar = () => {
  const navigate = useNavigate();
  return (
    <nav className={styles.sidebar} aria-label="Navigation menu">
      <div className={styles['sidebar-header']}>
        <h1 className={styles['sidebar-logo']} onClick={() => navigate("/")}>AelanG</h1>
      </div>
      <div className={styles['sidebar-nav']} role="list">

        {/* Study Zone với submenu */}
        <div className={styles['has-submenu']}>
          <div className={styles['nav-item']}>
            <svg viewBox="0 0 24 24" fill="none">
              <path fill="#00FFFF" d="M12 3l7 7h-2v7H7v-7H5l7-7Z" />
            </svg>
            <span>Study Zone</span>
          </div>

          <div className={styles.submenu}>
            <div className={styles['submenu-item']}>
              <svg viewBox="0 0 24 24" fill="none">
                <path fill="#38bdf8" d="M5 12l5 5L20 7" />
              </svg>
              Nghe
            </div>
            <div className={styles['submenu-item']}>
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="6" fill="#f472b6" />
              </svg>
              Nói
            </div>
            <div className={styles['submenu-item']}>
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="4" y="4" width="16" height="16" rx="2" fill="#a3e635" />
              </svg>
              Đọc
            </div>
            <div
              className={styles['submenu-item']}
              onClick={() => navigate("/grammar")}
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path fill="#facc15" d="M6 12h12v2H6z" />
              </svg>
              Viết
            </div>
          </div>
        </div>

        {/* Các mục khác */}
        <div className={styles['nav-item']}>
          <svg viewBox="0 0 24 24" fill="none">
            <path fill="#ef4444" d="M12 4c4 0 5 2 5 2v12c0 1-1 2-3 2s-3-1-3-2v-12s1-2 3-2Z" />
          </svg>
          AI
        </div>

        <div className={styles['nav-item']}>
          <svg viewBox="0 0 24 24" fill="none">
            <rect width="16" height="16" x="4" y="4" rx="2" fill="#fbbf24" />
          </svg>
          Bảng xếp hạng
        </div>

        <div className={styles['nav-item']}>
          <svg viewBox="0 0 24 24" fill="none">
            <path fill="#f59e0b" d="M6 8v8h12V8H6Z" />
          </svg>
          Nhiệm vụ
        </div>

        <div className={styles['nav-item']}>
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="4" y="4" width="16" height="16" rx="2" fill="#f87171" />
          </svg>
          Cửa hàng
        </div>

        <div className={styles['nav-item']}>
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#6b7280" strokeDasharray="1 1" strokeWidth="2" />
          </svg>
          Hồ sơ
        </div>

        <div className={styles['nav-item']}>
          <svg viewBox="0 0 24 24" fill="none">
            <path fill="#a78bfa" d="M16 13v-2H8V8l-5 4 5 4v-3h8zM20 3H12v2h8v14h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
          </svg>
          Đăng xuất
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
