import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SplashScreen() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 900);
    const t3 = setTimeout(() => setPhase(3), 1600);
    const t4 = setTimeout(() => navigate('/home'), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2);
                   clearTimeout(t3); clearTimeout(t4); };
  }, [navigate]);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 50%, #8B5CF6 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, overflow: 'hidden',
    }}>
      {/* Animated background rings */}
      {[280, 380, 480, 580].map((size, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: size, height: size,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.08)',
          animation: `ringPulse 3s ease-in-out ${i * 0.3}s infinite`,
        }} />
      ))}

      {/* Logo icon */}
      <div style={{
        fontSize: '64px',
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        marginBottom: '16px',
        filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))',
      }}>
        AWAAZ
      </div>

      {/* AWAAZ text */}
      <div style={{
        fontSize: '52px', fontWeight: '800',
        color: '#FFFFFF', letterSpacing: '-2px',
        opacity: phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.5s ease-out',
        fontFamily: 'Inter, system-ui, sans-serif',
        textShadow: '0 4px 20px rgba(0,0,0,0.2)',
      }}>
        AWAAZ
      </div>

      {/* Tagline */}
      <div style={{
        fontSize: '16px', color: 'rgba(255,255,255,0.75)',
        marginTop: '10px', letterSpacing: '3px',
        textTransform: 'uppercase', fontWeight: '500',
        opacity: phase >= 3 ? 1 : 0,
        transform: phase >= 3 ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all 0.4s ease-out',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        Your Voice. Their Action.
      </div>

      {/* Loading bar */}
      <div style={{
        position: 'absolute', bottom: '48px',
        width: '120px', height: '3px',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: '2px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: '2px',
          backgroundColor: '#FFFFFF',
          width: phase >= 1 ? '100%' : '0%',
          transition: 'width 2.2s ease-out',
        }} />
      </div>

      <style>{`
        @keyframes ringPulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.05); opacity: 0.15; }
        }
      `}</style>
    </div>
  );
}
