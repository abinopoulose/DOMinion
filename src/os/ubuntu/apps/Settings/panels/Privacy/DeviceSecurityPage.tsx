
export function DeviceSecurityPage() {
  return (
    <div style={{ maxWidth: '680px', width: '100%', margin: '0 auto' }}>
      <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '16px' }}>Security Events</div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        backgroundColor: 'var(--color-bg-input, #ffffff)',
        borderRadius: '12px',
        border: '1px solid var(--color-border, rgba(0,0,0,0.1))',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary, #aaa)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: '24px' }}>
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M12 7v5l4 2" />
        </svg>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-text-secondary, #aaa)', opacity: 0.8 }}>
          No Events
        </div>
      </div>
    </div>
  );
}
