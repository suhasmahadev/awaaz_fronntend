import React from 'react';

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section section-light" style={{ background: '#f7fafc' }}>
      <div className="landing-container">
        <h2 className="section-title fade-in">How It Works</h2>
        <div className="steps-container fade-in">
          <div className="step-item">
            <div className="step-number">1</div>
            <h3>Report Issue</h3>
            <p>Use voice or text in any local language to describe the civic issue to our AI agent.</p>
          </div>
          <div className="step-item">
            <div className="step-number">2</div>
            <h3>AI Analysis</h3>
            <p>The AI categorizes the complaint and matches it against public civic contracts automatically.</p>
          </div>
          <div className="step-item">
            <div className="step-number">3</div>
            <h3>Action Taken</h3>
            <p>Verified complaints are assigned to contractors with transparent tracking and SLA deadlines.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
