import React from 'react';

export default function Footer() {
  return (
    <footer className="landing-footer fade-in">
      <div className="landing-container">
        <div className="footer-grid">
          <div>
            <div className="footer-logo">AWAAZ</div>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
              Empowering citizens and ensuring accountability through AI-driven civic engagement.
            </p>
          </div>
          <div>
            <h4 style={{ color: 'white', marginBottom: '15px' }}>Product</h4>
            <div className="footer-links">
              <a href="#">Features</a>
              <a href="#">How it works</a>
              <a href="#">Pricing</a>
            </div>
          </div>
          <div>
            <h4 style={{ color: 'white', marginBottom: '15px' }}>Resources</h4>
            <div className="footer-links">
              <a href="#">Documentation</a>
              <a href="#">API Reference</a>
              <a href="#">Blog</a>
            </div>
          </div>
          <div>
            <h4 style={{ color: 'white', marginBottom: '15px' }}>Legal</h4>
            <div className="footer-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} AWAAZ. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
