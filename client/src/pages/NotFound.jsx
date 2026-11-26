import { Link } from 'react-router-dom';
import { FiHome, FiGrid, FiCalendar, FiAlertCircle } from 'react-icons/fi';

const NotFound = () => {
  return (
    <main
      style={{
        minHeight: 'calc(100dvh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '104px 20px 64px'
      }}
    >
      <div
        className="glass-strong"
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '40px 32px',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            margin: '0 auto 16px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-soft)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-hidden="true"
        >
          <FiAlertCircle size={22} />
        </div>
        <p
          className="tabular-nums"
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--accent)',
            marginBottom: '8px'
          }}
        >
          404 — Page not found
        </p>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 600,
            color: 'var(--text-strong)',
            marginBottom: '12px',
            letterSpacing: '-0.02em'
          }}
        >
          We couldn&apos;t find that page
        </h1>
        <p
          style={{
            fontSize: '0.9375rem',
            color: 'var(--text-body)',
            lineHeight: 1.6,
            marginBottom: '28px'
          }}
        >
          The link may be outdated or the address might have a typo. Use one of the links below to continue.
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            justifyContent: 'center'
          }}
        >
          <Link to="/" className="btn btn-primary">
            <FiHome size={16} aria-hidden="true" />
            <span>Home</span>
          </Link>
          <Link to="/services" className="btn btn-secondary">
            <FiGrid size={16} aria-hidden="true" />
            <span>Services</span>
          </Link>
          <Link to="/booking" className="btn btn-secondary">
            <FiCalendar size={16} aria-hidden="true" />
            <span>Book Now</span>
          </Link>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
