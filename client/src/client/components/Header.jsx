import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Header.module.css';
import { ThemeContext } from '../../context/ThemeContext';

const Header = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isDarkMode, toggleTheme } = useContext(ThemeContext);

    const menuItems = [
        { label: 'Học Tập', icon: '📚', path: '/study' },
        { label: 'AI Tutor', icon: '🤖', path: '/ai' },
        { label: 'Bảng Xếp Hạng', icon: '🏆', path: '/leaderboard' },
        { label: 'Nhiệm Vụ', icon: '✓', path: '/tasks' },
        { label: 'Cửa Hàng', icon: '🛍️', path: '/shop' },
    ];

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                {/* Logo */}
                <div className={styles.logo} onClick={() => navigate('/')}>
                    <span className={styles.logoIcon}>🌍</span>
                    <span className={styles.logoText}>AelanG</span>
                </div>

                {/* Hamburger Menu - Mobile */}
                <button
                    className={styles.hamburger}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                {/* Navigation Menu */}
                <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`}>
                    {menuItems.map((item) => (
                        <div
                            key={item.label}
                            className={styles.navItem}
                            onClick={() => {
                                navigate(item.path);
                                setIsMenuOpen(false);
                            }}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </nav>

                {/* User Actions */}
                <div className={styles.userActions}>
                    <div className={styles.userProfile}>
                        <div className={styles.avatar}>👤</div>
                        <span className={styles.username}>Người Dùng</span>
                    </div>
                    <button
                        className={styles.themeToggle}
                        onClick={toggleTheme}
                        title={isDarkMode ? 'Light mode' : 'Dark mode'}
                    >
                        {isDarkMode ? '☀️' : '🌙'}
                    </button>
                </div>

            </div>
        </header>
    );
};

export default Header;
