import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiAlertCircle, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import '../Admin.css';

const EMPTY_FORM = {
  name: '',
  description: '',
  category: 'repair',
  basePrice: '',
  discountPrice: '',
  duration: '60',
  features: ''
};

const ManageServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchServices = useCallback(async () => {
    setError('');
    try {
      const res = await api.get('/services');
      setServices(res.data.services || []);
    } catch {
      setError('Failed to load services.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api
      .get('/services')
      .then((res) => {
        if (active) setServices(res.data.services || []);
      })
      .catch(() => {
        if (active) setError('Failed to load services.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!showModal && !deleteTarget) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (!saving && !deleting) {
          setShowModal(false);
          setDeleteTarget(null);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showModal, deleteTarget, saving, deleting]);

  const openModal = (service = null) => {
    setFormError('');
    if (service) {
      setEditingService(service);
      setForm({
        name: service.name,
        description: service.description,
        category: service.category,
        basePrice: service.basePrice,
        discountPrice: service.discountPrice || '',
        duration: service.duration,
        features: service.features?.join(', ') || ''
      });
    } else {
      setEditingService(null);
      setForm(EMPTY_FORM);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setFormError('');

    if (!form.name || !form.description || !form.basePrice) {
      setFormError('Please fill in Service Name, Description, and Base Price.');
      return toast.error('Please fill required fields');
    }

    const payload = {
      ...form,
      basePrice: Number(form.basePrice),
      discountPrice: form.discountPrice ? Number(form.discountPrice) : 0,
      duration: Number(form.duration),
      features: form.features ? form.features.split(',').map((f) => f.trim()) : []
    };

    setSaving(true);
    try {
      if (editingService) {
        await api.put(`/admin/services/${editingService._id}`, payload);
        toast.success('Service updated');
      } else {
        await api.post('/admin/services', payload);
        toast.success('Service created');
      }
      setShowModal(false);
      fetchServices();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save service';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/services/${deleteTarget._id}`);
      toast.success('Service deleted');
      setDeleteTarget(null);
      fetchServices();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Manage Services</h1>
          <p className="admin-page-subtitle">
            Changes here update live service pricing and options on the website and booking flow.
          </p>
        </div>
        <button type="button" className="admin-add-btn" onClick={() => openModal()}>
          <FiPlus size={16} aria-hidden="true" />
          <span>Add Service</span>
        </button>
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
              fetchServices();
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
                  <th>Category</th>
                  <th>Status</th>
                  <th>Base Price</th>
                  <th>Discount Price</th>
                  <th>Duration</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: 40 }}>
                      Loading services...
                    </td>
                  </tr>
                ) : services.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}
                    >
                      No services configured yet.
                    </td>
                  </tr>
                ) : (
                  services.map((s) => {
                    const isActive = s.isActive !== false;
                    return (
                      <tr key={s._id}>
                        <td className="td-name">{s.name}</td>
                        <td style={{ textTransform: 'capitalize' }}>
                          {s.category?.replace('-', ' ')}
                        </td>
                        <td>
                          <span className={`badge ${isActive ? 'badge-completed' : 'badge-cancelled'}`}>
                            <span className="status-dot" aria-hidden="true" />
                            <span>{isActive ? 'Active' : 'Inactive'}</span>
                          </span>
                        </td>
                        <td className="tabular-nums">₹{s.basePrice}</td>
                        <td className="tabular-nums">
                          {s.discountPrice ? `₹${s.discountPrice}` : '—'}
                        </td>
                        <td className="tabular-nums">{s.duration} min</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              className="table-action-btn edit"
                              onClick={() => openModal(s)}
                            >
                              <FiEdit2 size={14} aria-hidden="true" /> Edit
                            </button>
                            <button
                              type="button"
                              className="table-action-btn delete"
                              onClick={() => setDeleteTarget(s)}
                            >
                              <FiTrash2 size={14} aria-hidden="true" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="admin-mobile-cards">
            {loading ? (
              <div className="dash-stat-card">Loading services...</div>
            ) : services.length === 0 ? (
              <div className="dash-stat-card admin-state-card">No services configured yet.</div>
            ) : (
              services.map((s) => (
                <article key={s._id} className="card admin-mobile-card">
                  <div className="amc-top">
                    <div>
                      <div className="td-name">{s.name}</div>
                      <div className="td-sub" style={{ textTransform: 'capitalize' }}>
                        {s.category?.replace('-', ' ')} · <span className="tabular-nums">{s.duration} min</span>
                      </div>
                    </div>
                    <strong className="tabular-nums" style={{ color: 'var(--navy)' }}>
                      ₹{s.discountPrice || s.basePrice}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="table-action-btn edit"
                      style={{ flex: 1 }}
                      onClick={() => openModal(s)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="table-action-btn delete"
                      style={{ flex: 1 }}
                      onClick={() => setDeleteTarget(s)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </>
      )}

      {/* Add / Edit Service Modal */}
      {showModal && (
        <div
          className="admin-modal-overlay"
          onClick={() => !saving && setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-modal-title"
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 id="service-modal-title" style={{ margin: 0 }}>
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => !saving && setShowModal(false)}
                aria-label="Close modal"
              >
                <FiX size={18} aria-hidden="true" />
              </button>
            </div>

            {formError && (
              <div className="booking-inline-alert" role="alert" style={{ marginBottom: 16 }}>
                <FiAlertCircle size={16} aria-hidden="true" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="admin-modal-form">
              <div>
                <label htmlFor="svc-name">Service Name *</label>
                <input
                  id="svc-name"
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. AC Repair"
                  required
                />
              </div>

              <div>
                <label htmlFor="svc-desc">Description *</label>
                <textarea
                  id="svc-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Service description shown to customers"
                  required
                />
              </div>

              <div>
                <label htmlFor="svc-category">Category</label>
                <select
                  id="svc-category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="repair">Repair</option>
                  <option value="installation">Installation</option>
                  <option value="gas-refill">Gas Refill</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="cleaning">Cleaning</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label htmlFor="svc-base">Base Price (₹) *</label>
                  <input
                    id="svc-base"
                    type="number"
                    min="0"
                    value={form.basePrice}
                    onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="svc-discount">Discount Price (₹)</label>
                  <input
                    id="svc-discount"
                    type="number"
                    min="0"
                    value={form.discountPrice}
                    onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="svc-duration">Duration (minutes)</label>
                <input
                  id="svc-duration"
                  type="number"
                  min="15"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="svc-features">Features (comma separated)</label>
                <input
                  id="svc-features"
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  placeholder="All brand support, 3 months Warranty"
                />
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="btn-cancel-edit"
                  disabled={saving}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Saving...' : editingService ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div
          className="admin-modal-overlay"
          onClick={() => !deleting && setDeleteTarget(null)}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-svc-title"
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 id="delete-svc-title">Delete {deleteTarget.name}?</h2>
            <p className="admin-page-subtitle" style={{ marginBottom: 20 }}>
              Deleting this service removes it from the public Services page and customer booking flow.
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                autoFocus
                className="btn-cancel-edit"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-save"
                style={{ backgroundColor: 'var(--danger)' }}
                disabled={deleting}
                onClick={executeDelete}
              >
                {deleting ? 'Deleting...' : 'Delete service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageServices;
