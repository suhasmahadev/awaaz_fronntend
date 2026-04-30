const fs = require('fs');
const path = require('path');

const srcPath = 'c:/Users/sinch/Desktop/xypher/v4/project/Carpulse-AI/frontend/src';

const files = {
  'styles/landing.css': 
.landing-page { font-family: 'Inter', system-ui, sans-serif; color: #1a202c; background-color: #f7fafc; overflow-x: hidden; }
.landing-container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.fade-in { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }
.fade-in.visible { opacity: 1; transform: translateY(0); }
.landing-navbar { position: fixed; top: 0; left: 0; right: 0; height: 70px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); z-index: 1000; display: flex; align-items: center; transition: box-shadow 0.3s ease; }
.landing-navbar.scrolled { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
.nav-content { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.nav-logo { font-size: 1.5rem; font-weight: 800; color: #2b6cb0; text-decoration: none; display: flex; align-items: center; gap: 8px;}
.nav-links { display: flex; gap: 30px; align-items: center; }
.nav-links a { text-decoration: none; color: #4a5568; font-weight: 500; transition: color 0.2s; cursor: pointer; }
.nav-links a:hover { color: #2b6cb0; }
.nav-btn { background: #2b6cb0; color: white !important; padding: 8px 20px; border-radius: 999px; font-weight: 600 !important; cursor: pointer; border: none; }
.hamburger { display: none; background: none; border: none; font-size: 1.5rem; cursor: pointer; }
.hero-section { padding: 120px 0 80px; display: flex; align-items: center; min-height: 80vh; }
.hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }
.hero-title { font-size: 3.5rem; line-height: 1.2; font-weight: 800; margin-bottom: 20px; color: #1a202c; }
.hero-subtitle { font-size: 1.25rem; color: #4a5568; margin-bottom: 30px; }
.hero-cta { display: flex; gap: 15px; }
.btn-primary { background: #2b6cb0; color: white; padding: 15px 30px; border-radius: 8px; font-weight: 600; text-decoration: none; border: none; cursor: pointer; font-size: 1.1rem; transition: background 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
.btn-primary:hover { background: #2c5282; }
.btn-secondary { background: white; color: #2b6cb0; padding: 15px 30px; border-radius: 8px; font-weight: 600; text-decoration: none; border: 1px solid #2b6cb0; cursor: pointer; font-size: 1.1rem; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
.btn-secondary:hover { background: #ebf8ff; }
.section { padding: 80px 0; }
.section-light { background: white; }
.section-dark { background: #1a202c; color: white; }
.section-title { text-align: center; font-size: 2.5rem; font-weight: 700; margin-bottom: 50px; }
.problem-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; }
.problem-card { background: #f7fafc; padding: 30px; border-radius: 12px; text-align: center; border: 1px solid #edf2f7; transition: transform 0.3s; }
.problem-card:hover { transform: translateY(-5px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
.problem-card h3 { font-size: 1.25rem; margin: 15px 0; }
.features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px; }
.feature-item { display: flex; gap: 20px; }
.feature-icon { background: #ebf8ff; color: #2b6cb0; width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
.steps-container { display: flex; justify-content: space-between; gap: 20px; }
.step-item { flex: 1; text-align: center; position: relative; }
.step-number { width: 50px; height: 50px; background: #2b6cb0; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; margin: 0 auto 20px; font-size: 1.2rem; }
.tech-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; text-align: center; }
.tech-item { background: #2d3748; padding: 20px; border-radius: 12px; color: white; }
.impact-stats { display: flex; justify-content: space-around; flex-wrap: wrap; gap: 30px; }
.stat-item { text-align: center; }
.stat-number { font-size: 3rem; font-weight: 800; color: #2b6cb0; margin-bottom: 10px; }
.team-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; }
.team-member { text-align: center; }
.team-img { width: 150px; height: 150px; border-radius: 50%; background: #e2e8f0; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: #a0aec0; }
.landing-footer { background: #1a202c; color: #a0aec0; padding: 60px 0 20px; }
.footer-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 40px; margin-bottom: 40px; }
.footer-logo { color: white; font-size: 1.5rem; font-weight: 800; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;}
.footer-links { display: flex; flex-direction: column; gap: 10px; }
.footer-links a { color: #a0aec0; text-decoration: none; }
.footer-bottom { text-align: center; border-top: 1px solid #2d3748; padding-top: 20px; }
.phone-mockup { position: relative; width: 300px; height: 600px; background: #000; border-radius: 40px; margin: 0 auto; border: 10px solid #2d3748; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
.phone-screen { background: #f7fafc; height: 100%; width: 100%; display: flex; flexDirection: column; padding: 20px; box-sizing: border-box; }

@media (max-width: 1024px) {
  .hero-grid { grid-template-columns: 1fr; text-align: center; }
  .hero-cta { justify-content: center; }
  .steps-container { flex-direction: column; gap: 40px; }
}
@media (max-width: 768px) {
  .nav-links { display: none; }
  .hamburger { display: block; }
  .nav-links.mobile-active { display: flex; flex-direction: column; position: absolute; top: 70px; left: 0; right: 0; background: white; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
  .hero-title { font-size: 2.5rem; }
  .hero-cta { flex-direction: column; }
  .btn-primary, .btn-secondary { width: 100%; }
}
  ,

  'utils/api.js': 
export async function initAnonSession() {
  try {
    const fingerprint = navigator.userAgent + "-" + window.innerWidth;
    const res = await fetch("http://localhost:8000/auth/anon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("Backend not available, continuing without session");
    return null;
  }
}
  ,

  'pages/LandingPage.jsx': 
import React, { useEffect, useState, lazy, Suspense } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import { initAnonSession } from '../utils/api';
import '../styles/landing.css';

const Problem = lazy(() => import('../components/Problem'));
const HowItWorks = lazy(() => import('../components/HowItWorks'));
const Features = lazy(() => import('../components/Features'));
const TechStack = lazy(() => import('../components/TechStack'));
const Impact = lazy(() => import('../components/Impact'));
const Preview = lazy(() => import('../components/Preview'));
const Team = lazy(() => import('../components/Team'));
const Footer = lazy(() => import('../components/Footer'));

export default function LandingPage() {
  const [, setAnonId] = useState(null);

  useEffect(() => {
    initAnonSession().then(data => {
      if (data?.anon_id) setAnonId(data.anon_id);
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    const els = document.querySelectorAll('.fade-in');
    els.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  });

  return (
    <div className="landing-page">
      <Navbar />
      <Hero />
      <Suspense fallback={<div style={{height: 200}}></div>}>
        <Problem />
        <HowItWorks />
        <Features />
        <Preview />
        <Impact />
        <TechStack />
        <Team />
        <Footer />
      </Suspense>
    </div>
  );
}
  ,

  'components/Navbar.jsx': 
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

  return (
    <nav className={\landing-navbar \\}>
      <div className="landing-container nav-content">
        <a href="#" className="nav-logo">
          ?? AppName
        </a>
        <button className="hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
          ?
        </button>
        <div className={\
av-links \\}>
          <a onClick={() => scrollTo('problem')}>Problem</a>
          <a onClick={() => scrollTo('features')}>Features</a>
          <a onClick={() => scrollTo('how-it-works')}>How It Works</a>
          <button className="nav-btn" onClick={() => navigate('/chat')}>Launch App</button>
        </div>
      </div>
    </nav>
  );
}
  ,

  'components/Hero.jsx': 
import React from 'react';
import PhoneMockup from './PhoneMockup';
import { useNavigate } from 'react-router-dom';

export default function Hero() {
  const navigate = useNavigate();
  
  const handleDownload = () => {
    window.location.href = "http://localhost:8000/api/download/apk";
  };

  return (
    <section className="hero-section">
      <div className="landing-container hero-grid">
        <div className="fade-in">
          <h1 className="hero-title">Intelligent Civic Action at Your Fingertips</h1>
          <p className="hero-subtitle">
            Report issues, track civic contracts, and ensure accountability using our AI-driven platform with full voice support.
          </p>
          <div className="hero-cta">
            <button className="btn-primary" onClick={() => navigate('/chat')}>
              Open Web App
            </button>
            <button className="btn-secondary" onClick={handleDownload}>
              ?? Download APK
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
  ,

  'components/PhoneMockup.jsx': 
import React from 'react';

export default function PhoneMockup() {
  return (
    <div className="phone-mockup">
      <div className="phone-screen">
        <div style={{ padding: '20px 10px', background: '#2b6cb0', color: 'white', borderRadius: '12px', width: '100%', marginBottom: '20px', textAlign: 'center' }}>
          <strong>AWAAZ AI Assistant</strong>
        </div>
        
        <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ background: '#e2e8f0', padding: '10px', borderRadius: '12px 12px 12px 0', alignSelf: 'flex-start', maxWidth: '80%' }}>
            Hi! How can I help you today?
          </div>
          <div style={{ background: '#2b6cb0', color: 'white', padding: '10px', borderRadius: '12px 12px 0 12px', alignSelf: 'flex-end', maxWidth: '80%' }}>
            I want to report a pothole.
          </div>
        </div>

        <div style={{ marginTop: 'auto', width: '100%', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ flex: 1, height: '40px', background: '#edf2f7', borderRadius: '20px', border: '1px solid #cbd5e1' }}></div>
          <button style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#2b6cb0', color: 'white', border: 'none', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            ??
          </button>
        </div>
      </div>
    </div>
  );
}
  ,

  'components/Problem.jsx': 
import React from 'react';

export default function Problem() {
  return (
    <section id="problem" className="section section-light">
      <div className="landing-container">
        <h2 className="section-title fade-in">The Problem We Solve</h2>
        <div className="problem-grid fade-in">
          <div className="problem-card">
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>??</div>
            <h3>Broken Infrastructure</h3>
            <p>Citizens face damaged roads and poor utilities with no easy way to report them effectively.</p>
          </div>
          <div className="problem-card">
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>??</div>
            <h3>Lack of Transparency</h3>
            <p>Civic contracts lack public visibility, making it hard to hold contractors accountable.</p>
          </div>
          <div className="problem-card">
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>???</div>
            <h3>Language Barriers</h3>
            <p>Non-English speakers struggle to use complex apps to file their grievances.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
  ,

  'components/HowItWorks.jsx': 
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
  ,

  'components/Features.jsx': 
import React from 'react';

export default function Features() {
  const features = [
    { icon: '??', title: 'Multilingual Voice AI', desc: 'Interact naturally in your local language. Our AI understands and processes speech seamlessly.' },
    { icon: '??', title: 'Smart Contract Matching', desc: 'Automatically cross-references your complaint with active government contracts and warranties.' },
    { icon: '??', title: 'Public Ledger Tracking', desc: 'Every action is securely logged on an immutable ledger for absolute transparency.' },
    { icon: '??', title: 'Works Offline', desc: 'Our PWA architecture ensures you can report issues even with poor internet connectivity.' },
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
  ,

  'components/Preview.jsx': 
import React from 'react';

export default function Preview() {
  return (
    <section className="section section-dark">
      <div className="landing-container text-center fade-in">
        <h2 className="section-title">See It In Action</h2>
        <div style={{ background: '#2d3748', borderRadius: '16px', padding: '20px', maxWidth: '800px', margin: '0 auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
           <div style={{ aspectRatio: '16/9', background: '#1a202c', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <span style={{ fontSize: '4rem', color: '#4a5568' }}>??</span>
           </div>
        </div>
      </div>
    </section>
  );
}
  ,

  'components/Impact.jsx': 
import React, { useEffect, useState } from 'react';

function Counter({ end, duration = 2000 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeProgress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <>{count}</>;
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
            <div className="stat-number">?<Counter end={10} />M+</div>
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
  ,

  'components/TechStack.jsx': 
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
  ,

  'components/Team.jsx': 
import React from 'react';

export default function Team() {
  const team = [
    { name: 'Developer One', role: 'Full Stack Engineer' },
    { name: 'Developer Two', role: 'AI Specialist' }
  ];
  return (
    <section className="section section-light">
      <div className="landing-container fade-in">
        <h2 className="section-title">The Team</h2>
        <div className="team-grid">
          {team.map((t, i) => (
            <div className="team-member" key={i}>
              <div className="team-img">??</div>
              <h3 style={{ marginBottom: '5px' }}>{t.name}</h3>
              <p style={{ color: '#4a5568' }}>{t.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
  ,

  'components/Footer.jsx': 
import React from 'react';

export default function Footer() {
  return (
    <footer className="landing-footer fade-in">
      <div className="landing-container">
        <div className="footer-grid">
          <div>
            <div className="footer-logo">?? AppName</div>
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
          <p>&copy; {new Date().getFullYear()} AppName. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
  
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(srcPath, relativePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content.trim());
}
console.log('Files generated successfully.');
