import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Header.module.css';
import { ThemeContext } from '../../context/ThemeContext';
import userService from '../../services/userService';
import { HighlightContext } from "../../context/HighlightContext";

const Header = () => {
    const navigate = useNavigate();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [chatEnabled, setChatEnabled] = useState(true);

    const { isDarkMode, toggleTheme } = useContext(ThemeContext);

    const [userName, setUserName] = useState("Người Dùng");
    const [avatarText, setAvatarText] = useState("👤");

    const { enablePopup, setEnablePopup } = useContext(HighlightContext);

    const computeInitials = (name) => {
        if (!name) return "👤";
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    };

    useEffect(() => {
        const stored = localStorage.getItem("supportChatEnabled");
        setChatEnabled(stored !== "false");
    }, []);

    /** Load User Info */
    useEffect(() => {
        let mounted = true;

        const loadUser = async () => {
            try {
                const data = await userService.getCurrentUser();
                if (!mounted) return;

                const name = data?.name || "Người Dùng";
                setUserName(name);
                setAvatarText(computeInitials(name));
            } catch {
                if (!mounted) return;
                setUserName("Người Dùng");
                setAvatarText("👤");
            }
        };

        loadUser();
        return () => (mounted = false);
    }, []);

    // Conditionally render menu items based on whether user data exists
    const menuItems = [
        { label: "Trang Chủ", icon: "🏠", path: "/" },
        { label: "AI Tutor", icon: "🤖", path: "/experience/ai-chat" },
        { label: "Chủ Đề", icon: "📚", path: "/topics" },
        { label: "Ngữ Pháp", icon: "📝", path: "/grammar" },
        { label: "Lộ Trình", icon: "🗺️", path: "/roadmaps" },
        { label: "Sổ Tay", icon: "📖", path: "/vocab-notebook" },
        { label: "Flashcards", icon: "🎴", path: "/flashcards" },
        { label: "Mở khóa Pro", icon: "💎", path: "/pricing" },
    ];

    const handleToggleChat = () => {
        const next = !chatEnabled;
        setChatEnabled(next);
        localStorage.setItem("supportChatEnabled", next ? "true" : "false");
        window.dispatchEvent(new CustomEvent("support-chat-toggle", { detail: { enabled: next } }));
    };

    return (
        <header className={styles.header}>
            <div className={styles.container}>

                {/* Logo */}
                <div className={styles.logo} onClick={() => navigate("/")}>
                    <span className={styles.logoIcon}>🌍</span>
                    <span className={styles.logoText}>AelanG</span>
                </div>

                {/* Hamburger menu (mobile) */}
                <button
                    className={styles.hamburger}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                {/* Navigation */}
                <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ""}`}>
                    {menuItems.map((item) => (
                        <div
                            key={item.label}
                            className={`${styles.navItem} ${item.label === "Mở khóa Pro" ? styles.proItem : ""}`}
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

                {/* User + settings */}
                <div className={styles.userActions}>

                    {/* User Profile */}
                    <div
                        className={styles.userProfile}
                        onClick={() => {
                            navigate("/profile");
                            setIsMenuOpen(false);
                        }}
                        title="Xem hồ sơ học tập"
                    >
                        <div className={styles.avatar}>{avatarText}</div>
                        <span className={styles.username}>{userName}</span>
                    </div>

                    {/* Theme toggle */}
                    <button
                        className={styles.themeToggle}
                        onClick={toggleTheme}
                        title={isDarkMode ? "Light mode" : "Dark mode"}
                    >
                        {isDarkMode ? "☀️" : "🌙"}
                    </button>

                    {/* Settings Dropdown */}
                    <div className={styles.settingsContainer}>
                        <div
                            className={styles.settingsButton}
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            title="Cài đặt"
                        >
                            ⋮
                        </div>

                        {isSettingsOpen && (
                            <div className={styles.settingsMenu}>

                                {/* Popup toggle */}
                                <div
                                    className={styles.settingsItem}
                                    onClick={() => setEnablePopup(!enablePopup)}
                                >
                                    {enablePopup ? "🔕 Tắt Popup Dịch" : "🔔 Bật Popup Dịch"}
                                </div>

                                {/* Notification toggle */}
                                <div className={styles.settingsItem}>
                                    🔕 Tắt thông báo
                                </div>

                                <div
                                    className={styles.settingsItem}
                                    onClick={handleToggleChat}
                                >
                                    {chatEnabled ? "🔕 Tắt chat hỗ trợ" : "🔔 Bật chat hỗ trợ"}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </header>
    );
};

export default Header;
