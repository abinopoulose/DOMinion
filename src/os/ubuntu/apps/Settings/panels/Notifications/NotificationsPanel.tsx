import { useState } from 'react';
import { SettingsPanelWrapper } from '../../components/SettingsPanelWrapper';
const terminalIcon = '/ubuntu/icons/terminal-app.png';
const fileManagerIcon = '/ubuntu/icons/folder.png';
const browserIcon = '/ubuntu/icons/browser.svg';
const textIcon = '/ubuntu/icons/text-editor.png';
const settingsIcon = '/ubuntu/icons/system-settings.png';

const APPS = [
  { id: 'browser', name: 'Browser', icon: browserIcon },
  { id: 'file-manager', name: 'Files', icon: fileManagerIcon },
  { id: 'settings', name: 'Settings', icon: settingsIcon },
  { id: 'terminal', name: 'Terminal', icon: terminalIcon },
  { id: 'text-editor', name: 'Text Editor', icon: textIcon },
];

export function NotificationsPanel() {
  const [dnd, setDnd] = useState(false);
  const [lockScreen, setLockScreen] = useState(true);
  const [appToggles, setAppToggles] = useState<Record<string, boolean>>(
    APPS.reduce((acc, app) => ({ ...acc, [app.id]: true }), {})
  );

  const toggleApp = (id: string) => {
    setAppToggles(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const headerToggle = (
    <div className="ubuntu-settings-toggle-container" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '14px', fontWeight: '500' }}>Do Not Disturb</span>
      <div 
        className={`ubuntu-settings-toggle ${dnd ? 'checked' : ''}`} 
        style={{ backgroundColor: dnd ? 'var(--color-accent)' : 'var(--color-surface-active)' }}
        onClick={() => setDnd(!dnd)}
      >
        <div className="ubuntu-settings-toggle-knob" style={{ transform: dnd ? 'translateX(24px)' : 'translateX(0)' }} />
      </div>
    </div>
  );

  return (
    <SettingsPanelWrapper title="Notifications" rightHeaderContent={headerToggle}>
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '24px' }}>
        <div className="ubuntu-settings-list-item clickable" onClick={() => setLockScreen(!lockScreen)}>
          <span>Lock Screen Notifications</span>
          <div className={`ubuntu-settings-toggle ${lockScreen ? 'checked' : ''}`} style={{ backgroundColor: lockScreen ? 'var(--color-accent)' : 'var(--color-surface-active)' }}>
            <div className="ubuntu-settings-toggle-knob" style={{ transform: lockScreen ? 'translateX(24px)' : 'translateX(0)' }} />
          </div>
        </div>
      </div>

      <div className="ubuntu-settings-section-title" style={{ padding: '0 8px 8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
        App Notifications
      </div>
      
      <div className="ubuntu-settings-list-group">
        {APPS.map(app => (
          <div 
            key={app.id} 
            className="ubuntu-settings-list-item clickable"
            onClick={() => toggleApp(app.id)}
            style={{ opacity: dnd ? 0.5 : 1, pointerEvents: dnd ? 'none' : 'auto' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img src={app.icon} alt={app.name} style={{ width: '32px', height: '32px' }} />
              <span>{app.name}</span>
            </div>
            <div className={`ubuntu-settings-toggle ${appToggles[app.id] ? 'checked' : ''}`} style={{ backgroundColor: appToggles[app.id] ? 'var(--color-accent)' : 'var(--color-surface-active)' }}>
              <div className="ubuntu-settings-toggle-knob" style={{ transform: appToggles[app.id] ? 'translateX(24px)' : 'translateX(0)' }} />
            </div>
          </div>
        ))}
      </div>
    </SettingsPanelWrapper>
  );
}
