import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/api';

const DROPDOWN_HIDE_DELAY = 120;

const AdminHeader = ({ theme, onThemeToggle, searchIndex = [] }) => {
  const [query, setQuery] = useState('');
  const [isSearchFocused, setSearchFocused] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  const filteredResults = useMemo(() => {
    if (query.trim().length < 2) return [];
    const lowerQuery = query.toLowerCase();
    return searchIndex.filter(item => item.title.toLowerCase().includes(lowerQuery)).slice(0, 5);
  }, [query, searchIndex]);

  const handleDocumentClick = (event) => {
    if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
      setNotificationsOpen(false);
    }
    if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
      setUserMenuOpen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const { logout, accessToken } = useAuth();

  useEffect(() => {
    if (accessToken) {
      api.get('/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      }).then(res => setUserInfo(res.data)).catch(err => {
        console.error('Failed to fetch user info', err);
        setUserInfo(null);
      });
    } else {
      setUserInfo(null);
    }
  }, [accessToken]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout thất bại', err);
    }
  };

  // const handleFullscreenToggle = async () => {
  //   try {
  //     if (!document.fullscreenElement) {
  //       await document.documentElement.requestFullscreen();
  //     } else {
  //       await document.exitFullscreen();
  //     }
  //   } catch (error) {
  //     console.error('Failed to toggle fullscreen', error);
  //   }
  // };

  const navbarThemeClass = theme === 'dark' ? 'navbar-dark' : 'navbar-light';

  return (
    <header className="admin-header">
      <nav className={`navbar navbar-expand-lg ${navbarThemeClass} bg-body border-bottom`}> 
        <div className="container-fluid">
          <Link className="navbar-brand d-flex align-items-center" to="/admin">
            <h1 className="h4 mb-0 fw-bold text-primary">AelanG</h1>
          </Link>

          <div className="search-container flex-grow-1 mx-4">
            <div className="position-relative">
              <input
                type="search"
                className="form-control"
                placeholder="Search... (Ctrl+K)"
                aria-label="Search"
                value={query}
                ref={searchInputRef}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), DROPDOWN_HIDE_DELAY)}
              />
              <i className="bi bi-search position-absolute top-50 end-0 translate-middle-y me-3" />
              {(isSearchFocused && filteredResults.length > 0) && (
                <div className="position-absolute top-100 start-0 w-100 bg-body border rounded-2 shadow-lg mt-1 z-3">
                  {filteredResults.map(result => (
                    <Link
                      key={result.title}
                      to={result.path}
                      className="d-block px-3 py-2 text-decoration-none text-body border-bottom"
                      onClick={() => {
                        setSearchFocused(false);
                        setQuery('');
                      }}
                    >
                      <div className="d-flex align-items-center">
                        <i className="bi bi-file-text me-2 text-muted" />
                        <span>{result.title}</span>
                        <small className="ms-auto text-muted">{result.type}</small>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="navbar-nav flex-row align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onThemeToggle}
              title="Toggle theme"
            >
              {theme === 'light' ? (
                <i className="bi bi-sun-fill" />
              ) : (
                <i className="bi bi-moon-fill" />
              )}
            </button>

            {/* <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleFullscreenToggle}
              title="Toggle fullscreen"
            >
              <i className="bi bi-arrows-fullscreen" />
            </button> */}

            <div className="dropdown" ref={notificationsRef}>
              <button
                type="button"
                className="btn btn-outline-secondary position-relative"
                onClick={() => setNotificationsOpen((prev) => !prev)}
              >
                <i className="bi bi-bell" />
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  2
                </span>
              </button>
              {notificationsOpen && (
                <ul className="dropdown-menu dropdown-menu-end show">
                  <li><h6 className="dropdown-header">Notifications</h6></li>
                  <li><Link className="dropdown-item" to="/admin/users" onClick={() => setNotificationsOpen(false)}>New user registered</Link></li>
                  <li><Link className="dropdown-item" to="/admin/reports" onClick={() => setNotificationsOpen(false)}>Server status update</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item text-center"
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigate('/admin/reports');
                      }}
                    >
                      View all notifications
                    </button>
                  </li>
                </ul>
              )}
            </div>

            <div className="dropdown" ref={userMenuRef}>
              <button
                type="button"
                className="btn btn-outline-secondary d-flex align-items-center"
                onClick={() => setUserMenuOpen((prev) => !prev)}
              >
                <img
                  src="/assets/images/avatar-placeholder.svg"
                  alt="User Avatar"
                  width="24"
                  height="24"
                  className="rounded-circle me-2"
                />
                <span className="d-none d-md-inline">{userInfo?.name || userInfo?.email || 'Staff'}</span>
                <i className="bi bi-chevron-down ms-1" />
              </button>
              {userMenuOpen && (
                <ul className="dropdown-menu dropdown-menu-end show">
                  {/* <li><Link className="dropdown-item" to="/profile" onClick={() => setUserMenuOpen(false)}><i className="bi bi-person me-2" />Profile</Link></li>
                  <li><Link className="dropdown-item" to="/settings" onClick={() => setUserMenuOpen(false)}><i className="bi bi-gear me-2" />Settings</Link></li> */}
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      <i className="bi bi-box-arrow-right me-2" />Logout
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default AdminHeader;
