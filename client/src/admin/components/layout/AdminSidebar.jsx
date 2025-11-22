import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

const getInitialSubmenuState = () => {
  try {
    const stored = localStorage.getItem('sidebar-submenus');
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Failed to parse sidebar state', error);
    return {};
  }
};

const requiresExactMatch = (path) => path === '/admin';

const AdminSidebar = ({ navPrimary = [], navAdmin = [] }) => {
  const [submenuState, setSubmenuState] = useState(getInitialSubmenuState);

  useEffect(() => {
    localStorage.setItem('sidebar-submenus', JSON.stringify(submenuState));
  }, [submenuState]);

  const handleToggleSubmenu = (submenuId) => {
    setSubmenuState((prev) => ({
      ...prev,
      [submenuId]: !prev[submenuId]
    }));
  };

  const getNavLinkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

  const renderNavItem = (item) => {
    if (item.children?.length) {
      const isExpanded = submenuState[item.submenuId] ?? true;
      return (
        <li className="nav-item" key={item.label}>
          <button
            type="button"
            className="nav-link d-flex align-items-center w-100"
            onClick={() => handleToggleSubmenu(item.submenuId)}
            aria-expanded={isExpanded}
          >
            <i className={`bi ${item.icon}`} />
            <span className="ms-2 flex-grow-1 text-start">{item.label}</span>
            {item.badge && (
              <span className={`badge ${item.badge.variant} rounded-pill me-2`}>{item.badge.text}</span>
            )}
            <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} ms-auto`} />
          </button>
          <div className={`collapse ${isExpanded ? 'show' : ''}`}>
            <ul className="nav nav-submenu">
              {item.children.map((child) => (
                <li className="nav-item" key={child.label}>
                  {child.path ? (
                    <NavLink
                      className={getNavLinkClass}
                      to={child.path}
                      end={requiresExactMatch(child.path)}
                    >
                      <i className={`bi ${child.icon}`} />
                      <span className="ms-2">{child.label}</span>
                    </NavLink>
                  ) : (
                    <a className="nav-link" href={child.href}>
                      <i className={`bi ${child.icon}`} />
                      <span className="ms-2">{child.label}</span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </li>
      );
    }

    return (
      <li className="nav-item" key={item.label}>
        {item.path ? (
          <NavLink
            className={getNavLinkClass}
            to={item.path}
            end={requiresExactMatch(item.path)}
          >
            <i className={`bi ${item.icon}`} />
            <span className="ms-2">{item.label}</span>
            {item.badge && (
              <span className={`badge ${item.badge.variant} rounded-pill ms-auto`}>{item.badge.text}</span>
            )}
          </NavLink>
        ) : (
          <a className="nav-link" href={item.href}>
            <i className={`bi ${item.icon}`} />
            <span className="ms-2">{item.label}</span>
            {item.badge && (
              <span className={`badge ${item.badge.variant} rounded-pill ms-auto`}>{item.badge.text}</span>
            )}
          </a>
        )}
      </li>
    );
  };

  return (
    <aside className="admin-sidebar" id="admin-sidebar">
      <div className="sidebar-content">
        <nav className="sidebar-nav">
          <ul className="nav flex-column">
            {navPrimary.map(renderNavItem)}
            {navAdmin.length > 0 && (
              <>
                <li className="nav-item mt-3">
                  <small className="text-muted px-3 text-uppercase fw-bold">Admin</small>
                </li>
                {navAdmin.map(item => (
                  <li className="nav-item" key={item.label}>
                    {item.path ? (
                      <NavLink
                        className={getNavLinkClass}
                        to={item.path}
                        end={requiresExactMatch(item.path)}
                      >
                        <i className={`bi ${item.icon}`} />
                        <span className="ms-2">{item.label}</span>
                      </NavLink>
                    ) : (
                      <a className="nav-link" href={item.href}>
                        <i className={`bi ${item.icon}`} />
                        <span className="ms-2">{item.label}</span>
                      </a>
                    )}
                  </li>
                ))}
              </>
            )}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default AdminSidebar;
