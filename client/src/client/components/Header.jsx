import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    FiHome,
    FiMap,
    FiBookOpen,
    FiBook,
    FiSearch,
    FiBell,
    FiChevronDown,
    FiMenu,
    FiX,
    FiSun,
    FiMoon,
    FiZap,
    FiLayers
} from 'react-icons/fi';
import { BsRobot } from "react-icons/bs";
import { GiNotebook,GiCardPick} from "react-icons/gi";
import styles from '../styles/Header.module.css';
import { ThemeContext } from '../../context/ThemeContext';
import userService from '../../services/userService';
import { HighlightContext } from "../../context/HighlightContext";

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [chatEnabled, setChatEnabled] = useState(true);
    const [searchValue, setSearchValue] = useState("");

    const { isDarkMode, toggleTheme } = useContext(ThemeContext);

    const [userName, setUserName] = useState("Người Dùng");
    const [avatarText, setAvatarText] = useState("👤");

    const { enablePopup, setEnablePopup } = useContext(HighlightContext);

    const settingsRef = useRef(null);

    const computeInitials = (name) => {
        if (!name) return "👤";
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const q = params.get("q");
        if (q) setSearchValue(q);
        else if (location.pathname !== "/search") setSearchValue("");
    }, [location]);

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

    // Close settings menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target)) {
                setIsSettingsOpen(false);
            }
        };
        if (isSettingsOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isSettingsOpen]);

    const menuItems = [
        { label: "Trang chủ", icon: <FiHome />, path: "/" },
        { label: "Lộ trình", icon: <FiMap />, path: "/roadmaps" },
        { label: "Chủ đề", icon: <FiBookOpen />, path: "/topics" },
        {
            label: "Học tập",
            icon: <FiLayers />,
            children: [
                { label: "AI Tutor", icon: <BsRobot/>, path: "/experience/ai-chat" },
                { label: "Công cụ", icon: <FiBook />, path: "/tools" },
                { label: "Flashcards", icon: <GiCardPick/>, path: "/flashcards" },
            ]
        },
        { label: "Sổ tay", icon: <GiNotebook />, path: "/notebooks" },
    ];

    const isActivePath = (path) => {
        if (!path) return false;
        if (path === "/") return location.pathname === "/";
        return location.pathname.startsWith(path);
    };

    const isActiveDropdown = (children) =>
        children?.some((c) => isActivePath(c.path));

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const q = searchValue.trim();
        if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
    };

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
                    <div className={styles.logoBadge}>
                        <img
                            src="/favicon-32x32.png"
                            alt="AelanG"
                            className={styles.logoImg}
                        />
                    </div>
                    <span className={styles.logoText}>AelanG</span>
                </div>

                {/* Hamburger menu (mobile) */}
                <button
                    className={`${styles.hamburger} ${isMenuOpen ? styles.hamburgerActive : ""}`}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? <FiX /> : <FiMenu />}
                </button>

                {/* Navigation */}
                <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ""}`}>
                    {menuItems.map((item) => {
                        if (item.children) {
                            const active = isActiveDropdown(item.children);
                            return (
                                <div key={item.label} className={styles.dropdown}>
                                    <div className={`${styles.dropdownTrigger} ${active ? styles.navItemActive : ""}`}>
                                        <span className={styles.navIcon}>{item.icon}</span>
                                        <span>{item.label}</span>
                                        <FiChevronDown className={styles.dropdownArrow} />
                                    </div>
                                    <div className={styles.dropdownMenu}>
                                        {item.children.map((child) => (
                                            <div
                                                key={child.label}
                                                className={`${styles.dropdownItem} ${isActivePath(child.path) ? styles.dropdownItemActive : ""}`}
                                                onClick={() => {
                                                    navigate(child.path);
                                                    setIsMenuOpen(false);
                                                }}
                                            >
                                                <span className={styles.navIcon}>{child.icon}</span>
                                                <span>{child.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        }

                        const active = isActivePath(item.path);
                        return (
                            <div
                                key={item.label}
                                className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                                onClick={() => {
                                    navigate(item.path);
                                    setIsMenuOpen(false);
                                }}
                            >
                                <span className={styles.navIcon}>{item.icon}</span>
                                <span>{item.label}</span>
                            </div>
                        );
                    })}
                </nav>

                {/* Search bar */}
                <form className={styles.searchBox} onSubmit={handleSearchSubmit}>
                    <FiSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm bài học, từ vựng..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className={styles.searchInput}
                    />
                </form>

                {/* User + settings */}
                <div className={styles.userActions}>

                    {/* Pro upgrade button */}
                    <button
                        className={styles.proButton}
                        onClick={() => navigate("/pricing")}
                        title="Nâng cấp tài khoản Pro"
                    >
                        <FiZap className={styles.proIcon} />
                        <span>Nâng cấp Pro</span>
                    </button>

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
                        <FiChevronDown className={styles.userChevron} />
                    </div>
                     {/* Theme toggle */}
                    <button
                        className={styles.iconButton}
                        onClick={toggleTheme}
                        title={isDarkMode ? "Light mode" : "Dark mode"}
                    >
                        {isDarkMode ? <FiSun /> : <FiMoon />}
                    </button>
                    {/* Settings Dropdown */}
                    <div className={styles.settingsContainer} ref={settingsRef}>
                        <button
                            className={styles.iconButton}
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            title="Cài đặt"
                        >
                            <FiBell />
                        </button>

                        {isSettingsOpen && (
                            <div className={styles.settingsMenu}>
                                <div
                                    className={styles.settingsItem}
                                    onClick={() => setEnablePopup(!enablePopup)}
                                >
                                    {enablePopup ? "🔕 Tắt Popup Dịch" : "🔔 Bật Popup Dịch"}
                                </div>

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
