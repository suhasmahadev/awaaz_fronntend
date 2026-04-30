import React from 'react';

export default function Features() {
  const features = [
    { icon: '🎤', title: 'Multilingual Voice AI', desc: 'Interact naturally in your local language. Our AI understands and processes speech seamlessly.' },
    { icon: '🔍', title: 'Smart Contract Matching', desc: 'Automatically cross-references your complaint with active government contracts and warranties.' },
    { icon: '📊', title: 'Public Ledger Tracking', desc: 'Every action is securely logged on an immutable ledger for absolute transparency.' },
    { icon: '📱', title: 'Works Offline', desc: 'Our PWA architecture ensures you can report issues even with poor internet connectivity.' },
  ];

  return (
    <section id="features" className="section section-light">
      <div className="landing-container">
        <h2 className="section-title fade-in">Platform Features</h2>
        <div className="features-grid fade-in">
          {features.map((f, i) => (
            <div className="feature-item" key={i}>
              <div className="feature-icon">{f.icon}</div>
              <div>
                <h3 style={{ marginBottom: '10px', fontSize: '1.25rem' }}>{f.title}</h3>
                <p style={{ color: '#4a5568' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
