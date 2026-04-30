import React from 'react';

export default function TechStack() {
  const tech = ['React Native / Vite', 'FastAPI', 'Gemini AI', 'PostgreSQL', 'Workbox PWA'];
  return (
    <section className="section section-light" style={{ background: '#f7fafc' }}>
      <div className="landing-container fade-in">
        <h2 className="section-title">Powered By</h2>
        <div className="tech-grid">
          {tech.map((t, i) => (
            <div className="tech-item" key={i}>
              <strong>{t}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
