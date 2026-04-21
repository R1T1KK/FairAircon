import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import '../Admin.css';

const ManageServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', category: 'repair', basePrice: '', discountPrice: '', duration: '60', features: ''
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await api.get('/services');
      setServices(res.data.services);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (service = null) => {
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
      setForm({ name: '', description: '', category: 'repair', basePrice: '', discountPrice: '', duration: '60', features: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.description || !form.basePrice) {
      return toast.error('Please fill required fields');
    }
    const payload = {
      ...form,
      basePrice: Number(form.basePrice),
      discountPrice: form.discountPrice ? Number(form.discountPrice) : 0,
      duration: Number(form.duration),
      features: form.features ? form.features.split(',').map(f => f.trim()) : []
    };

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
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await api.delete(`/admin/services/${id}`);
      toast.success('Service deleted');
      fetchServices();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  return (
    <div>
      <h1 className="admin-page-title">Manage Services</h1>

      <div className="admin-toolbar">
        <div></div>
        <button className="admin-add-btn" onClick={() => openModal()}>
          <FiPlus /> Add Service
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Base Price</th>
              <th>Discount Price</th>
              <th>Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
            ) : services.map((s) => (
              <tr key={s._id}>
                <td className="td-name">{s.name}</td>
                <td style={{ textTransform: 'capitalize' }}>{s.category}</td>
                <td>₹{s.basePrice}</td>
                <td>{s.discountPrice ? `₹${s.discountPrice}` : '-'}</td>
                <td>{s.duration} min</td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="table-action-btn edit" onClick={() => openModal(s)}><FiEdit2 /> Edit</button>
                    <button className="table-action-btn delete" onClick={() => handleDelete(s._id)}><FiTrash2 /> Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingService ? 'Edit Service' : 'Add New Service'}</h2>
            <div className="admin-modal-form">
              <div>
                <label>Service Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. AC Repair" />
              </div>
              <div>
                <label>Description *</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="3" placeholder="Service description" />
              </div>
              <div>
                <label>Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="repair">Repair</option>
                  <option value="installation">Installation</option>
                  <option value="gas-refill">Gas Refill</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="cleaning">Cleaning</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label>Base Price (₹) *</label>
                  <input type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
                </div>
                <div>
                  <label>Discount Price (₹)</label>
                  <input type="number" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} />
                </div>
              </div>
              <div>
                <label>Duration (minutes)</label>
                <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
              </div>
              <div>
                <label>Features (comma separated)</label>
                <input value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="Feature 1, Feature 2, ..." />
              </div>
              <div className="admin-modal-actions">
                <button className="btn-save" onClick={handleSubmit}>{editingService ? 'Update' : 'Create'}</button>
                <button className="btn-cancel-edit" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageServices;
