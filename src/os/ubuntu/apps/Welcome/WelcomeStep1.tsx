import React from 'react';

export function WelcomeStep1({ onNext }: { onNext: () => void }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 20 }}>
        <button
          onClick={onNext}
          style={{
            padding: '6px 20px',
            borderRadius: '6px',
            border: 'none',
            background: '#e95420',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'filter 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
        >
          Next
        </button>
      </div>
      <img src="/ubuntu/settings/24-log.png" alt="Ubuntu Noble Numbat" width="320" style={{ marginBottom: '24px' }} />
      <h1 style={{ fontSize: '24px', margin: '0 0 12px 0', fontWeight: 600 }}>Welcome to Ubuntu 24.04 LTS!</h1>
      <p style={{ fontSize: '14px', color: '#555', textAlign: 'center', maxWidth: '420px', lineHeight: 1.5, marginBottom: '24px' }}>
        Complete your setup with additional settings and we'll have you up and running in no time
      </p>
    </div>
  );
}
