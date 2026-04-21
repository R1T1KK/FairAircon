import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { FiSearch } from 'react-icons/fi';
import '../Admin.css';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q);
  });

  return (
    <div>
      <h1 className="admin-page-title">Manage Users</h1>

      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
            <input
              className="admin-search"
              style={{ paddingLeft: 36 }}
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select className="admin-filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="user">Users</option>
            <option value="technician">Technicians</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No users found</td></tr>
            ) : (
              filtered.map((u) => (
                <tr key={u._id}>
                  <td className="td-name">{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-confirmed' : u.role === 'technician' ? 'badge-in-progress' : 'badge-pending'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td>
                    <select 
                      className="admin-role-select" 
                      value={u.role} 
                      onChange={async (e) => {
                        const newRole = e.target.value;
                        if (window.confirm(`Are you sure you want to change ${u.name}'s role to ${newRole}?`)) {
                          try {
                            await api.put(`/admin/users/${u._id}/role`, { role: newRole });
                            fetchUsers();
                          } catch (err) {
                            alert('Failed to update role');
                          }
                        }
                      }}
                    >
                      <option value="user">User</option>
                      <option value="technician">Technician</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageUsers;
