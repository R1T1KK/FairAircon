import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { FiSearch, FiPhone, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import '../Admin.css';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleConfirm, setRoleConfirm] = useState(null); // { user, newRole }

  const fetchUsers = useCallback(async () => {
    setError('');
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.users || []);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    let active = true;
    const params = {};
    if (roleFilter) params.role = roleFilter;

    api
      .get('/admin/users', { params })
      .then((res) => {
        if (active) {
          setUsers(res.data.users || []);
          setError('');
        }
      })
      .catch(() => {
        if (active) setError('Failed to load users.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [roleFilter]);

  useEffect(() => {
    if (!roleConfirm) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setRoleConfirm(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [roleConfirm]);

  const executeRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success('User role updated');
      fetchUsers();
    } catch {
      toast.error('Failed to update role');
    }
  };

  const filtered = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    );
  });

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Manage Users</h1>
          <p className="admin-page-subtitle tabular-nums">
            {filtered.length} account{filtered.length === 1 ? '' : 's'} shown
          </p>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <div className="admin-search-wrap">
            <FiSearch size={16} className="admin-search-icon" aria-hidden="true" />
            <input
              type="search"
              aria-label="Search users"
              className="admin-search"
              placeholder="Search name, email, or phone"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            aria-label="Filter by role"
            className="admin-filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="user">Customers</option>
            <option value="technician">Technicians</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="dash-stat-card admin-state-card" role="alert">
          <FiAlertCircle size={24} aria-hidden="true" />
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setLoading(true);
              fetchUsers();
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Change Role</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: 40 }}>
                      Loading users...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u._id}>
                      <td className="td-name">{u.name}</td>
                      <td>{u.email}</td>
                      <td className="tabular-nums">
                        {u.phone ? (
                          <a href={`tel:${u.phone}`} style={{ color: 'var(--cobalt)' }}>
                            {u.phone}
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            u.role === 'admin'
                              ? 'badge-completed'
                              : u.role === 'technician'
                              ? 'badge-in-progress'
                              : 'badge-pending'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="tabular-nums">
                        {new Date(u.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td>
                        <select
                          aria-label={`Change role for ${u.name}`}
                          className="admin-role-select"
                          value={u.role}
                          onChange={(e) => {
                            const newRole = e.target.value;
                            if (newRole !== u.role) {
                              setRoleConfirm({ user: u, newRole });
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

          {/* Mobile Cards */}
          <div className="admin-mobile-cards">
            {loading ? (
              <div className="dash-stat-card">Loading users...</div>
            ) : filtered.length === 0 ? (
              <div className="dash-stat-card admin-state-card">No users found</div>
            ) : (
              filtered.map((u) => (
                <article key={u._id} className="card admin-mobile-card">
                  <div className="amc-top">
                    <div>
                      <div className="td-name">{u.name}</div>
                      <div className="td-sub">{u.email}</div>
                    </div>
                    <span
                      className={`badge ${
                        u.role === 'admin'
                          ? 'badge-completed'
                          : u.role === 'technician'
                          ? 'badge-in-progress'
                          : 'badge-pending'
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    {u.phone ? (
                      <a href={`tel:${u.phone}`} className="btn btn-secondary btn-sm">
                        <FiPhone size={14} aria-hidden="true" />
                        <span className="tabular-nums">{u.phone}</span>
                      </a>
                    ) : (
                      <span className="td-sub">No phone</span>
                    )}
                    <select
                      aria-label={`Change role for ${u.name}`}
                      className="admin-role-select"
                      value={u.role}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        if (newRole !== u.role) {
                          setRoleConfirm({ user: u, newRole });
                        }
                      }}
                    >
                      <option value="user">User</option>
                      <option value="technician">Technician</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </article>
              ))
            )}
          </div>
        </>
      )}

      {/* Role Change Confirmation Modal */}
      {roleConfirm && (
        <div
          className="admin-modal-overlay"
          onClick={() => setRoleConfirm(null)}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="role-confirm-title"
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 id="role-confirm-title">Change user role?</h2>
            <p className="admin-page-subtitle" style={{ marginBottom: 20 }}>
              Change <strong>{roleConfirm.user.name}</strong> from{' '}
              <strong>{roleConfirm.user.role}</strong> to <strong>{roleConfirm.newRole}</strong>?
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                autoFocus
                className="btn-cancel-edit"
                onClick={() => setRoleConfirm(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-save"
                onClick={() => {
                  const { user: targetUser, newRole } = roleConfirm;
                  setRoleConfirm(null);
                  executeRoleChange(targetUser._id, newRole);
                }}
              >
                Confirm change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
