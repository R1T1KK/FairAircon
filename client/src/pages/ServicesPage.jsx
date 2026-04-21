import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FaWrench, FaTools, FaWind, FaBroom, FaBolt, FaShieldAlt, FaArrowRight } from 'react-icons/fa';
import ReviewSection from '../components/reviews/ReviewSection';
import './Services.css';

const iconMap = {
  repair: <FaWrench />,
  installation: <FaTools />,
  'gas-refill': <FaWind />,
  maintenance: <FaShieldAlt />,
  cleaning: <FaBroom />,
  emergency: <FaBolt />,
};

const categories = [
  { key: 'all', label: 'All Services' },
  { key: 'repair', label: 'Repair' },
  { key: 'installation', label: 'Installation' },
  { key: 'gas-refill', label: 'Gas Refill' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'cleaning', label: 'Cleaning' },
];

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await api.get('/services');
      setServices(res.data.services);
      setFiltered(res.data.services);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterByCategory = (cat) => {
    setActiveCategory(cat);
    if (cat === 'all') {
      setFiltered(services);
    } else {
      setFiltered(services.filter(s => s.category === cat));
    }
  };

  return (
    <div className="services-page">
      <div className="services-page-hero">
        <div className="container">
          <h1 className="animate-fade-in-up">Our Services</h1>
          <p className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Expert AC solutions for every need — from repair to maintenance
          </p>
        </div>
      </div>

      <div className="container">
        <div className="category-filter">
          {categories.map((cat) => (
            <button key={cat.key} className={`filter-btn ${activeCategory === cat.key ? 'active' : ''}`} onClick={() => filterByCategory(cat.key)}>
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="services-loading">Loading services...</div>
        ) : (
          <div className="services-page-grid stagger-children">
            {filtered.map((service) => (
              <div key={service._id} className="sp-card glass-card animate-fade-in-up">
                <div className="sp-card-icon">{iconMap[service.category] || <FaWrench />}</div>
                <h3>{service.name}</h3>
                <p className="sp-card-desc">{service.description}</p>
                {service.features?.length > 0 && (
                  <ul className="sp-card-features">
                    {service.features.map((f, i) => (
                      <li key={i}>✓ {f}</li>
                    ))}
                  </ul>
                )}
                <div className="sp-card-footer">
                  <div className="sp-card-pricing">
                    <span className="sp-price">₹{service.discountPrice || service.basePrice}</span>
                    {service.discountPrice > 0 && <span className="sp-original">₹{service.basePrice}</span>}
                  </div>
                  <Link to="/booking" className="service-book-btn">Book Now <FaArrowRight /></Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Reviews Section at the bottom */}
      <ReviewSection />
    </div>
  );
};

export default ServicesPage;
