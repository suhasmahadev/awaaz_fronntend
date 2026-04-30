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
    let mounted = true;
    initAnonSession().then(data => {
      if (mounted && data?.anon_id) {
        setAnonId(data.anon_id);
      }
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    document.body.classList.add('landing-active');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    // A slight delay to ensure lazy loaded components are registered
    const timeout = setTimeout(() => {
      const els = document.querySelectorAll('.fade-in');
      els.forEach(el => observer.observe(el));
    }, 100);

    return () => {
      document.body.classList.remove('landing-active');
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="landing-page">
      <Navbar />
      <Hero />
      <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
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
