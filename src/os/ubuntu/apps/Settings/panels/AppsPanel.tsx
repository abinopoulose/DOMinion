import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';
import './AppsPanel.css';
import terminalIcon from '../../../assets/icons/terminal.svg';
import fileManagerIcon from '../../../assets/icons/file-manager.svg';
import browserIcon from '../../../assets/icons/browser.svg';
import textIcon from '../../../assets/icons/text.svg';
import settingsIcon from '../../../assets/icons/settings.svg';
import { useState } from 'react';

const MOCK_APPS = [
  { id: 'browser', name: 'Browser', icon: browserIcon, size: '254 MB' },
  { id: 'file-manager', name: 'Files', icon: fileManagerIcon, size: '12 MB' },
  { id: 'settings', name: 'Settings', icon: settingsIcon, size: '4 MB' },
  { id: 'terminal', name: 'Terminal', icon: terminalIcon, size: '8 MB' },
  { id: 'text-editor', name: 'Text Editor', icon: textIcon, size: '6 MB' },
];

export function AppsPanel() {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  if (selectedApp) {
    const app = MOCK_APPS.find(a => a.id === selectedApp);
    if (!app) return null;

    const backButton = (
      <button className="ubuntu-settings-back-button" onClick={() => setSelectedApp(null)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>
    );

    return (
      <SettingsPanelWrapper title={app.name} leftHeaderContent={backButton}>
        <div className="ubuntu-settings-app-detail-header">
          <img src={app.icon} alt={app.name} className="ubuntu-settings-app-detail-icon" />
          <div className="ubuntu-settings-app-detail-info">
            <h2 style={{ margin: 0 }}>{app.name}</h2>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>{app.size}</span>
          </div>
        </div>

        <div className="ubuntu-settings-section-title" style={{ padding: '24px 8px 8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
          Permissions
        </div>
        
        <div className="ubuntu-settings-list-group">
          <div className="ubuntu-settings-list-item">
            <span>Notifications</span>
            <div className="ubuntu-settings-toggle checked" style={{ backgroundColor: 'var(--color-accent)' }}>
              <div className="ubuntu-settings-toggle-knob" style={{ transform: 'translateX(24px)' }} />
            </div>
          </div>
          <div className="ubuntu-settings-list-item">
            <span>Search</span>
            <div className="ubuntu-settings-toggle checked" style={{ backgroundColor: 'var(--color-accent)' }}>
              <div className="ubuntu-settings-toggle-knob" style={{ transform: 'translateX(24px)' }} />
            </div>
          </div>
          <div className="ubuntu-settings-list-item">
            <span>Run in Background</span>
            <div className="ubuntu-settings-toggle" style={{ backgroundColor: 'var(--color-surface-active)' }}>
              <div className="ubuntu-settings-toggle-knob" style={{ transform: 'translateX(0)' }} />
            </div>
          </div>
        </div>
      </SettingsPanelWrapper>
    );
  }

  return (
    <SettingsPanelWrapper title="Apps">
      <div className="ubuntu-settings-list-group">
        {MOCK_APPS.map(app => (
          <div 
            key={app.id} 
            className="ubuntu-settings-list-item clickable ubuntu-settings-app-list-item"
            onClick={() => setSelectedApp(app.id)}
          >
            <div className="ubuntu-settings-app-list-info">
              <img src={app.icon} alt={app.name} className="ubuntu-settings-app-list-icon" />
              <span>{app.name}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        ))}
      </div>
    </SettingsPanelWrapper>
  );
}
