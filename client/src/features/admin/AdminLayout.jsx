import { NavLink, Outlet } from 'react-router-dom';
import { FiGrid, FiCalendar, FiSettings, FiUsers, FiArrowLeft } from 'react-icons/fi';
import { FaSnowflake } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './Admin.css';

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <FaSnowflake className="admin-logo-icon" />
          <span>Fair Aircon Admin</span>
        </div>
        <nav className="admin-nav">
          <NavLink to="/admin" end className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            <FiGrid /> Dashboard
          </NavLink>
          <NavLink to="/admin/bookings" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            <FiCalendar /> Bookings
          </NavLink>
          <NavLink to="/admin/services" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            <FiSettings /> Services
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            <FiUsers /> Users
          </NavLink>
        </nav>
        <Link to="/" className="admin-back-link">
          <FiArrowLeft /> Back to Website
        </Link>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
