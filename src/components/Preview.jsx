import React from 'react';

export default function Preview() {
  return (
    <section className="section section-dark">
      <div className="landing-container text-center fade-in">
        <h2 className="section-title">See It In Action</h2>
        <div style={{ background: '#2d3748', borderRadius: '16px', padding: '20px', maxWidth: '800px', margin: '0 auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
           <div style={{ aspectRatio: '16/9', background: '#1a202c', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <span style={{ fontSize: '4rem', color: '#4a5568' }}>▶️</span>
           </div>
        </div>
      </div>
    </section>
  );
}
