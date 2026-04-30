import React from 'react';

export default function Problem() {
  return (
    <section id="problem" className="section section-light">
      <div className="landing-container">
        <h2 className="section-title fade-in">The Problem We Solve</h2>
        <div className="problem-grid fade-in">
          <div className="problem-card">
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🚧</div>
            <h3>Broken Infrastructure</h3>
            <p>Citizens face damaged roads and poor utilities with no easy way to report them effectively.</p>
          </div>
          <div className="problem-card">
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📄</div>
            <h3>Lack of Transparency</h3>
            <p>Civic contracts lack public visibility, making it hard to hold contractors accountable.</p>
          </div>
          <div className="problem-card">
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🗣️</div>
            <h3>Language Barriers</h3>
            <p>Non-English speakers struggle to use complex apps to file their grievances.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
