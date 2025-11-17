import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Header.module.css';
import { ThemeContext } from '../../context/ThemeContext';
import userService from '../../services/userService';

const Header = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isDarkMode, toggleTheme } = useContext(ThemeContext);
    const [userName, setUserName] = useState('Người Dùng');
    const [avatarText, setAvatarText] = useState('👤');

    const computeInitials = (value) => {
        if (!value) return '👤';
        const parts = value.trim().split(' ').filter(Boolean);
        if (parts.length === 0) return '👤';
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    };

    useEffect(() => {
        let isMounted = true;

        const loadUser = async () => {
            try {
                const data = await userService.getCurrentUser();
                if (!isMounted) return;
                const name = data?.name || 'Người Dùng';
                setUserName(name);
                setAvatarText(computeInitials(name));
            } catch (error) {
                if (!isMounted) return;
                setUserName('Người Dùng');
                setAvatarText('👤');
            }
        };

        loadUser();

        return () => {
            isMounted = false;
        };
    }, []);

    const menuItems = [
        { label: 'Trang Chủ', icon: '🏠', path: '/' },
        { label: 'AI Tutor', icon: '🤖', path: '/experience/ai-chat' },
        { label: 'Chủ Đề', icon: '📚', path: '/topics' },
        { label: 'Ngữ Pháp', icon: '📝', path: '/grammar' },
        { label: 'Lộ Trình', icon: '🗺️', path: '/roadmaps' },
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
                    <div
                        className={styles.userProfile}
                        onClick={() => {
                            navigate('/profile');
                            setIsMenuOpen(false);
                        }}
                        title="Xem hồ sơ học tập"
                    >
                        <div className={styles.avatar}>{avatarText}</div>
                        <span className={styles.username}>{userName}</span>
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
