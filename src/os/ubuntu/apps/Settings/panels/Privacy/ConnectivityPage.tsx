import { useState } from 'react';

export function ConnectivityPage() {
  const [connectivityEnabled, setConnectivityEnabled] = useState(true);

  return (
    <div style={{ maxWidth: '680px', width: '100%', margin: '0 auto' }}>
      <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
        Connectivity checking is used to detect connection issues and helps you to stay online.
        <br/>
        If your network communications are being monitored, it could be used to gather technical information about this computer.
      </p>
      <div className="ubuntu-settings-list-group">
        <div className="ubuntu-settings-list-item interactive" onClick={() => setConnectivityEnabled(!connectivityEnabled)}>
          <span>Connectivity Checking</span>
          <div className={`ubuntu-settings-toggle ${connectivityEnabled ? 'checked' : ''}`}>
            <div className="ubuntu-settings-toggle-knob" />
          </div>
        </div>
      </div>
    </div>
  );
}
