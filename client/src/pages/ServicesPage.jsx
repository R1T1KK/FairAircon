import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiTool,
  FiSettings,
  FiWind,
  FiDroplet,
  FiShield,
  FiZap,
  FiCheck,
  FiChevronRight,
  FiAlertCircle
} from 'react-icons/fi';
import api from '../services/api';
import ReviewSection from '../components/reviews/ReviewSection';
import './Services.css';

const iconMap = {
  repair: <FiTool size={20} aria-hidden="true" />,
  installation: <FiSettings size={20} aria-hidden="true" />,
  'gas-refill': <FiWind size={20} aria-hidden="true" />,
  maintenance: <FiShield size={20} aria-hidden="true" />,
  cleaning: <FiDroplet size={20} aria-hidden="true" />,
  emergency: <FiZap size={20} aria-hidden="true" />
};

const categories = [
  { key: 'all', label: 'All Services' },
  { key: 'repair', label: 'Repair' },
  { key: 'installation', label: 'Installation' },
  { key: 'gas-refill', label: 'Gas Refill' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'cleaning', label: 'Cleaning' }
];

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadServices = useCallback(async () => {
    setError('');
    try {
      const res = await api.get('/services');
      setServices(res.data.services || []);
    } catch {
      setError('Could not load services. Please check your connection and try again.');
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
        if (active) setError('Could not load services. Please check your connection and try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered =
    activeCategory === 'all'
      ? services
      : services.filter((s) => s.category === activeCategory);

  return (
    <main className="services-page">
      {/* Shared Navy Page Header */}
      <section className="page-header-band">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <FiChevronRight size={14} aria-hidden="true" />
            <span aria-current="page">Services</span>
          </nav>
          <h1>AC services &amp; pricing</h1>
          <p>
            Residential and commercial air conditioning solutions across Mumbai with upfront starting rates and a 3-month repair warranty.
          </p>
        </div>
      </section>

      <section className="section services-catalog-section">
        <div className="container">
          <div className="category-filter" role="tablist" aria-label="Filter services by category">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat.key}
                className={`filter-btn ${activeCategory === cat.key ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="services-page-grid" aria-label="Loading services">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="card sp-card sp-skeleton" aria-hidden="true">
                  <div className="sp-skel-circle" />
                  <div className="sp-skel-line title" />
                  <div className="sp-skel-line" />
                  <div className="sp-skel-line short" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="card services-state-card" role="alert">
              <FiAlertCircle size={24} aria-hidden="true" />
              <p>{error}</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setLoading(true);
                  loadServices();
                }}
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card services-state-card">
              <p>No services found in this category.</p>
              {activeCategory !== 'all' && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveCategory('all')}
                >
                  Show all services
                </button>
              )}
            </div>
          ) : (
            <div className="services-page-grid">
              {filtered.map((service) => {
                const activePrice = service.discountPrice || service.basePrice;
                const hasDiscount =
                  service.discountPrice > 0 && service.discountPrice < service.basePrice;
                return (
                  <article key={service._id} className="card sp-card">
                    <div className="sp-card-top">
                      <div className="sp-card-icon">
                        {iconMap[service.category] || <FiTool size={20} aria-hidden="true" />}
                      </div>
                      {service.duration && (
                        <span className="sp-duration tabular-nums">{service.duration} min</span>
                      )}
                    </div>

                    <h2>{service.name}</h2>
                    <p className="sp-card-desc">{service.description}</p>

                    {service.features?.length > 0 && (
                      <ul className="sp-card-features">
                        {service.features.map((f, i) => (
                          <li key={i}>
                            <FiCheck size={14} className="sp-check-icon" aria-hidden="true" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="sp-card-footer">
                      <div className="sp-card-pricing">
                        <span className="sp-price-label">From</span>
                        <div className="sp-price-row">
                          <span className="sp-price tabular-nums">
                            ₹{activePrice.toLocaleString('en-IN')}
                          </span>
                          {hasDiscount && (
                            <span className="sp-original tabular-nums">
                              ₹{service.basePrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link to="/booking" className="btn btn-primary btn-sm">
                        Book now
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <ReviewSection />
    </main>
  );
};

export default ServicesPage;
