import { useState } from 'react';

export function LocationPage() {
  const [locationEnabled, setLocationEnabled] = useState(false);

  return (
    <div style={{ maxWidth: '680px', width: '100%', margin: '0 auto' }}>
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '16px' }}>
        <div className="ubuntu-settings-list-item interactive" onClick={() => setLocationEnabled(!locationEnabled)}>
          <span>Automatic Device Location</span>
          <div className={`ubuntu-settings-toggle ${locationEnabled ? 'checked' : ''}`}>
            <div className="ubuntu-settings-toggle-knob" />
          </div>
        </div>
      </div>
      <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
        Automatic device location uses sources like GPS, Wi-Fi and cellular to determine an approximate location for this device. Location data is sent to Mozilla Location Services as part of this feature.
        <br />
        <a href="#" style={{ color: '#e5534b', textDecoration: 'none' }}>Learn about what data is collected, and how it is used.</a>
      </p>

      <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>Permitted Apps</div>
      <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
        The following sandboxed apps have been given access to location data. Apps that are not sandboxed can access location data without asking for permission.
      </p>
      <div className="ubuntu-settings-list-group">
        <div className="ubuntu-settings-list-item" style={{ justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
          No sandboxed apps have asked for location access
        </div>
      </div>
    </div>
  );
}
