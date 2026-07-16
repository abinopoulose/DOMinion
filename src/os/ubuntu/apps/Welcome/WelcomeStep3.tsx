import React from 'react';

export function WelcomeStep3({ onFinish }: { onFinish: () => void }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#1a1a1a', background: '#ffffff', flexShrink: 0, borderBottom: '1px solid #f0f0f0', position: 'relative' }}>
        Setup Complete
        <button 
          onClick={onFinish}
          style={{ position: 'absolute', right: '12px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <img src="/ubuntu/settings/24-log.png" alt="Noble Numbat Crown" width="240" style={{ marginBottom: '32px' }} />
        
        <h2 style={{ fontSize: '24px', margin: '0 0 16px 0', fontWeight: 500, color: '#1a1a1a' }}>
          You're all set!
        </h2>
        
        <div style={{ textAlign: 'center', marginBottom: '40px', color: '#666', fontSize: '15px', lineHeight: 1.5 }}>
          Ubuntu is fully set up and ready for you to use.
        </div>

        <button
          onClick={onFinish}
          style={{
            padding: '12px 40px',
            borderRadius: '6px',
            border: 'none',
            background: '#e95420',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 500,
            boxShadow: '0 2px 8px rgba(233, 84, 32, 0.3)',
            transition: 'transform 0.1s, filter 0.15s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          Start Using Ubuntu
        </button>
      </div>
    </div>
  );
}
