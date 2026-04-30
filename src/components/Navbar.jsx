import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: el.offsetTop - 70, behavior: 'smooth' });
    }
  };

const styles = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
  },
  innerContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 32px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  logo: {
    background: 'linear-gradient(135deg, #4C1D95, #7C3AED)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontSize: '22px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '40px',
    listStyle: 'none',
  },
  navLink: {
    color: '#6B7280',
    fontSize: '15px',
    fontWeight: '500',
    textDecoration: 'none',
    padding: '4px 0',
    transition: 'color 0.2s',
    cursor: 'pointer',
  },
  navLinkActive: {
    color: '#6D28D9',
    fontWeight: '600',
    borderBottom: '2px solid #6D28D9',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  btnSecondary: {
    backgroundColor: '#FFFFFF',
    border: '1.5px solid #D1D5DB',
    color: '#374151',
    borderRadius: '10px',
    padding: '8px 18px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(109,40,217,0.35)',
  },
};

  return (
  <nav style={styles.nav}>
    <div style={styles.innerContainer}>
      <div onClick={() => navigate('/')} style={{...styles.logo, cursor: 'pointer'}}>
        AWAAZ
      </div>

      <ul style={styles.navLinks}>
        <li>
          <a style={{
            ...styles.navLink,
            ...(window.location.pathname === '/dashboard' ? styles.navLinkActive : {})
          }} onClick={() => navigate('/dashboard')}>
            Dashboard
          </a>
        </li>
        <li>
          <a style={{
            ...styles.navLink,
            ...(window.location.pathname.includes('/community') ? styles.navLinkActive : {})
          }} onClick={() => navigate('/community')}>
            Community
          </a>
        </li>
        <li>
          <a style={{
            ...styles.navLink,
            ...(window.location.pathname.includes('/map') ? styles.navLinkActive : {})
          }} onClick={() => navigate('/map')}>
            Map
          </a>
        </li>
        <li>
          <a style={{
            ...styles.navLink,
            ...(window.location.pathname.includes('/ledger') ? styles.navLinkActive : {})
          }} onClick={() => navigate('/ledger')}>
            Contractor Ledger
          </a>
        </li>
      </ul>

      <div style={styles.navRight}>
        <button style={styles.btnPrimary} onClick={() => navigate('/ngo-login')}>
          NGO? Login
        </button>
      </div>
    </div>
  </nav>
  );
}
