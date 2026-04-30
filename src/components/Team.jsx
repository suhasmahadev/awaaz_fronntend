import React from 'react';

export default function Team() {
  const team = [
    { name: 'Developer One', role: 'Full Stack Engineer' },
    { name: 'Developer Two', role: 'AI Specialist' },
    { name: 'Developer Three', role: 'Backend Engineer' }
  ];
  return (
    <section className="section section-light">
      <div className="landing-container fade-in">
        <h2 className="section-title">The Team</h2>
        <div className="team-grid">
          {team.map((t, i) => (
            <div className="team-member" key={i}>
              <div className="team-img">👤</div>
              <h3 style={{ marginBottom: '5px' }}>{t.name}</h3>
              <p style={{ color: '#4a5568' }}>{t.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
