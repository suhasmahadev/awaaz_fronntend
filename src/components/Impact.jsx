import React, { useEffect, useState } from 'react';

function Counter({ end, duration = 2000 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    let animationFrameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeProgress * end));
      
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };
    
    // Use an IntersectionObserver to only animate when in view
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        animationFrameId = window.requestAnimationFrame(step);
        observer.disconnect();
      }
    });

    const el = document.getElementById(`counter-${end}`);
    if (el) observer.observe(el);

    return () => {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [end, duration]);

  return <span id={`counter-${end}`}>{count}</span>;
}

export default function Impact() {
  return (
    <section className="section section-light">
      <div className="landing-container fade-in">
        <h2 className="section-title">Our Projected Impact</h2>
        <div className="impact-stats">
          <div className="stat-item">
            <div className="stat-number"><Counter end={5000} />+</div>
            <div style={{ color: '#4a5568', fontWeight: '500' }}>Issues Resolved</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">₹<Counter end={10} />M+</div>
            <div style={{ color: '#4a5568', fontWeight: '500' }}>Contract Fraud Prevented</div>
          </div>
          <div className="stat-item">
            <div className="stat-number"><Counter end={99} />%</div>
            <div style={{ color: '#4a5568', fontWeight: '500' }}>Faster Processing</div>
          </div>
        </div>
      </div>
    </section>
  );
}
