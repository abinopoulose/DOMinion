
export function RegionLanguagePage() {
  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 20px', fontFamily: 'Ubuntu, Inter, system-ui, sans-serif' }}>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: '1.5', margin: '0 0 32px 0' }}>
        The language setting is used for interface text and web pages. Formats are used for
        numbers, dates, and currencies.
      </p>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 12px 12px' }}>
          System
        </h3>
        <div className="ubuntu-settings-list-group">
          <div className="ubuntu-settings-list-item interactive">
            <span style={{ fontSize: '14px' }}>Manage Installed Languages</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 12px 12px' }}>
          Your Account
        </h3>
        <div className="ubuntu-settings-list-group">
          <div className="ubuntu-settings-list-item interactive" style={{ alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '14px' }}>Language</span>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>English (United States)</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
          <div className="ubuntu-settings-list-item interactive" style={{ alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '14px' }}>Formats</span>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>United States</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
