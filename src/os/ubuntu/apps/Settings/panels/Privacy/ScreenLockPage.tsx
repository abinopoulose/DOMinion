import { useState } from 'react';
import { SettingsDropdown } from '../../components/SettingsDropdown';

export function ScreenLockPage() {
  const [autoLock, setAutoLock] = useState(true);
  const [lockNotifications, setLockNotifications] = useState(true);
  const [lockOnSuspend, setLockOnSuspend] = useState(true);

  return (
    <div style={{ maxWidth: '680px', width: '100%', margin: '0 auto' }}>
      <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
        Automatically locking the screen prevents others from accessing the computer while you're away
      </p>
      <div className="ubuntu-settings-list-group">
        <div className="ubuntu-settings-list-item" style={{ overflow: 'visible' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span>Blank Screen Delay</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Period of inactivity until screen blanks</span>
          </div>
          <SettingsDropdown
            value="never"
            onChange={() => {}}
            options={[
              { value: '1', label: '1 minute' },
              { value: '5', label: '5 minutes' },
              { value: 'never', label: 'Never' }
            ]}
          />
        </div>
        <div className="ubuntu-settings-list-item interactive" onClick={() => setAutoLock(!autoLock)}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span>Automatic Screen Lock</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Locks the screen after it blanks</span>
          </div>
          <div className={`ubuntu-settings-toggle ${autoLock ? 'checked' : ''}`}>
            <div className="ubuntu-settings-toggle-knob" />
          </div>
        </div>
        <div className="ubuntu-settings-list-item" style={{ overflow: 'visible' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span>Automatic Screen Lock Delay</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Time from screen blank to screen lock</span>
          </div>
          <SettingsDropdown
            value="screen-turns-off"
            onChange={() => {}}
            options={[
              { value: 'screen-turns-off', label: 'Screen Turns Off' },
              { value: '30s', label: '30 seconds' },
              { value: '1m', label: '1 minute' }
            ]}
          />
        </div>
        <div className="ubuntu-settings-list-item interactive" onClick={() => setLockNotifications(!lockNotifications)}>
          <span>Lock Screen Notifications</span>
          <div className={`ubuntu-settings-toggle ${lockNotifications ? 'checked' : ''}`}>
            <div className="ubuntu-settings-toggle-knob" />
          </div>
        </div>
        <div className="ubuntu-settings-list-item interactive" onClick={() => setLockOnSuspend(!lockOnSuspend)}>
          <span>Lock Screen on Suspend</span>
          <div className={`ubuntu-settings-toggle ${lockOnSuspend ? 'checked' : ''}`}>
            <div className="ubuntu-settings-toggle-knob" />
          </div>
        </div>
      </div>
    </div>
  );
}
