import { useState, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  FiGrid,
  FiCalendar,
  FiSettings,
  FiUsers,
  FiArrowLeft,
  FiMenu,
  FiX,
  FiLogOut,
  FiTool
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

const AdminLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!drawerOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [drawerOpen]);

  const closeDrawer = () => setDrawerOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      {/* Mobile Top Bar */}
      <header className="admin-mobile-topbar">
        <button
          type="button"
          className="admin-menu-toggle"
          onClick={() => setDrawerOpen(!drawerOpen)}
          aria-label={drawerOpen ? 'Close admin menu' : 'Open admin menu'}
          aria-expanded={drawerOpen}
          aria-controls="admin-sidebar-nav"
        >
          {drawerOpen ? <FiX size={20} aria-hidden="true" /> : <FiMenu size={20} aria-hidden="true" />}
        </button>
        <span className="admin-mobile-title">Fair Aircon Admin</span>
        <button
          type="button"
          onClick={handleLogout}
          className="admin-mobile-logout"
          aria-label="Log out"
        >
          <FiLogOut size={18} aria-hidden="true" />
        </button>
      </header>

      {drawerOpen && (
        <div
          className="admin-drawer-backdrop"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      <aside
        id="admin-sidebar-nav"
        className={`admin-sidebar ${drawerOpen ? 'open' : ''}`}
        aria-label="Admin navigation"
      >
        <div className="admin-sidebar-header">
          <FiTool size={18} className="admin-logo-icon" aria-hidden="true" />
          <span>Fair Aircon Admin</span>
        </div>

        <nav className="admin-nav">
          <NavLink
            to="/admin"
            end
            onClick={closeDrawer}
            className={({ isActive }) =>
              isActive ? 'admin-nav-link active' : 'admin-nav-link'
            }
          >
            <FiGrid size={17} aria-hidden="true" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/admin/bookings"
            onClick={closeDrawer}
            className={({ isActive }) =>
              isActive ? 'admin-nav-link active' : 'admin-nav-link'
            }
          >
            <FiCalendar size={17} aria-hidden="true" />
            <span>Bookings</span>
          </NavLink>
          <NavLink
            to="/admin/services"
            onClick={closeDrawer}
            className={({ isActive }) =>
              isActive ? 'admin-nav-link active' : 'admin-nav-link'
            }
          >
            <FiSettings size={17} aria-hidden="true" />
            <span>Services</span>
          </NavLink>
          <NavLink
            to="/admin/users"
            onClick={closeDrawer}
            className={({ isActive }) =>
              isActive ? 'admin-nav-link active' : 'admin-nav-link'
            }
          >
            <FiUsers size={17} aria-hidden="true" />
            <span>Users</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          {user?.name && (
            <div className="admin-account-meta">
              <span className="admin-account-name">{user.name}</span>
              <span className="admin-account-role">Administrator</span>
            </div>
          )}
          <Link to="/" onClick={closeDrawer} className="admin-back-link">
            <FiArrowLeft size={16} aria-hidden="true" />
            <span>Back to Website</span>
          </Link>
          <button type="button" onClick={handleLogout} className="admin-logout-link">
            <FiLogOut size={16} aria-hidden="true" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-main-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
