import { useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminSidebar from '../admin/components/layout/AdminSidebar';
import AdminHeader from '../admin/components/layout/AdminHeader';
import AdminFooter from '../admin/components/layout/AdminFooter';
import FloatingHamburger from '../admin/components/layout/FloatingHamburger';
import { ThemeContext } from '../context/ThemeContext';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../admin/styles/admin.css';

const MOBILE_BREAKPOINT = 992;

const AdminLayout = ({ children }) => {
  const themeContext = useContext(ThemeContext);
  const isDarkMode = themeContext?.isDarkMode ?? false;
  const toggleTheme = themeContext?.toggleTheme ?? (() => {});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < MOBILE_BREAKPOINT) {
        setSidebarCollapsed(false);
      } else {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleSidebar = () => {
    if (window.innerWidth < MOBILE_BREAKPOINT) {
      setMobileSidebarOpen(prev => !prev);
    } else {
      setSidebarCollapsed(prev => !prev);
    }
  };

  return (
    <div className={`admin-wrapper${sidebarCollapsed ? ' sidebar-collapsed' : ''}${mobileSidebarOpen ? ' sidebar-open' : ''}`}>
      <AdminHeader theme={isDarkMode ? 'dark' : 'light'} onThemeToggle={toggleTheme} />
      <AdminSidebar />
      <FloatingHamburger collapsed={sidebarCollapsed || mobileSidebarOpen} onToggle={handleToggleSidebar} />
      {mobileSidebarOpen && <div className="sidebar-backdrop" onClick={() => setMobileSidebarOpen(false)} />}
      <main className="admin-main">
        {children}
      </main>
      <AdminFooter />
    </div>
  );
};

export default AdminLayout;
