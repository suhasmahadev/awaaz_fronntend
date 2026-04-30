import React from 'react';
import PhoneMockup from './PhoneMockup';
import { useNavigate } from 'react-router-dom';

const heroStyle = {
  background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 55%, #8B5CF6 100%)',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 24px',
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
};

const heroTitleStyle = {
  fontSize: 'clamp(42px, 7vw, 80px)',
  fontWeight: '800',
  color: '#FFFFFF',
  lineHeight: '1.1',
  letterSpacing: '-2px',
  marginBottom: '20px',
  maxWidth: '800px',
};

const heroSubtitleStyle = {
  fontSize: 'clamp(16px, 2vw, 20px)',
  color: 'rgba(255,255,255,0.78)',
  maxWidth: '560px',
  lineHeight: '1.7',
  marginBottom: '40px',
};

const btnPrimaryStyle = {
  background: '#FFFFFF',
  color: '#6D28D9',
  border: 'none',
  borderRadius: '50px',
  padding: '16px 40px',
  fontSize: '16px',
  fontWeight: '700',
  cursor: 'pointer',
  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  transition: 'transform 0.2s, box-shadow 0.2s',
};

const btnSecondaryStyle = {
  background: 'transparent',
  color: '#FFFFFF',
  border: '2px solid rgba(255,255,255,0.5)',
  borderRadius: '50px',
  padding: '16px 36px',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'border-color 0.2s',
};

const btnRowStyle = {
  display: 'flex',
  gap: '16px',
  flexWrap: 'wrap',
  justifyContent: 'center',
};

export default function Hero() {
  const navigate = useNavigate();

  // PWA install prompt — let the browser handle it natively
  const handleDownload = () => {
    if (window.__pwaInstallPrompt) {
      window.__pwaInstallPrompt.prompt();
    } else {
      // Fallback: guide user to use browser's install option
      alert("To install: tap the browser menu → 'Add to Home Screen' or 'Install App'.");
    }
  };

  return (
    <section style={heroStyle}>
      <div style={{
        position: 'absolute',
        width: '600px', height: '600px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)',
        top: '-100px', right: '-100px',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        width: '400px', height: '400px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)',
        bottom: '-80px', left: '-80px',
        pointerEvents: 'none',
      }} />
      
      <div className="landing-container hero-grid" style={{ zIndex: 1, position: 'relative' }}>
        <div className="fade-in">
          <h1 style={heroTitleStyle}>Intelligent Civic Action at Your Fingertips</h1>
          <p style={heroSubtitleStyle}>
            Report issues, track civic contracts, and ensure accountability using our AI-driven platform with full voice support.
          </p>
          <div style={btnRowStyle}>
            <button 
              style={btnPrimaryStyle} 
              onClick={() => navigate('/dashboard')}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              Open Web App
            </button>
            <button style={btnSecondaryStyle} onClick={handleDownload}>
              📱 Download App
            </button>
          </div>
        </div>
        <div className="fade-in" style={{ display: 'flex', justifyContent: 'center' }}>
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}
