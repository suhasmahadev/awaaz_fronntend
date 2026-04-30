import React from 'react';

export default function PhoneMockup() {
  return (
    <div className="phone-mockup">
      <div className="phone-screen" style={{ background: '#111827', border: '8px solid #1F2937', borderRadius: '24px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 10px', background: 'linear-gradient(135deg, #4C1D95, #6D28D9)', color: 'white', width: '100%', marginBottom: '20px', textAlign: 'center' }}>
          <strong>AWAAZ AI Assistant</strong>
        </div>
        
        <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: '15px', padding: '0 10px' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px 12px 12px 0', alignSelf: 'flex-start', maxWidth: '80%' }}>
            Hi! How can I help you today?
          </div>
          <div style={{ background: '#6D28D9', color: 'white', padding: '10px', borderRadius: '12px 12px 0 12px', alignSelf: 'flex-end', maxWidth: '80%' }}>
            I want to report a pothole on MG Road.
          </div>
        </div>

        <div style={{ marginTop: 'auto', width: '100%', display: 'flex', gap: '10px', alignItems: 'center', padding: '10px' }}>
          <div style={{ flex: 1, height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.2)' }}></div>
          <button style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#6D28D9', color: 'white', border: 'none', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            🎤
          </button>
        </div>
      </div>
    </div>
  );
}
