import { useState } from 'react';
import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';
import './SharingPanel.css';

export function SharingPanel() {
  const [sharingEnabled, setSharingEnabled] = useState(false);
  const [hostname, setHostname] = useState('ubuntu-web');
  const [fileSharing, setFileSharing] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [mediaSharing, setMediaSharing] = useState(false);

  const headerToggle = (
    <div className="ubuntu-settings-toggle-container" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div 
        className={`ubuntu-settings-toggle ${sharingEnabled ? 'checked' : ''}`} 
        style={{ backgroundColor: sharingEnabled ? 'var(--color-accent)' : 'var(--color-surface-active)' }}
        onClick={() => setSharingEnabled(!sharingEnabled)}
      >
        <div className="ubuntu-settings-toggle-knob" style={{ transform: sharingEnabled ? 'translateX(24px)' : 'translateX(0)' }} />
      </div>
    </div>
  );

  return (
    <SettingsPanelWrapper title="Sharing" headerContent={headerToggle}>
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '24px' }}>
        <div className="ubuntu-settings-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '16px', gap: '8px' }}>
          <span style={{ fontWeight: '500' }}>Computer Name</span>
          <input 
            type="text" 
            value={hostname} 
            onChange={(e) => setHostname(e.target.value)}
            className="sharing-hostname-input"
          />
        </div>
      </div>
      
      <div className="ubuntu-settings-list-group" style={{ opacity: sharingEnabled ? 1 : 0.5, pointerEvents: sharingEnabled ? 'auto' : 'none' }}>
        <div className="ubuntu-settings-list-item clickable" onClick={() => setFileSharing(!fileSharing)}>
          <span>File Sharing</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>{fileSharing ? 'On' : 'Off'}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
        
        <div className="ubuntu-settings-list-item clickable" onClick={() => setScreenSharing(!screenSharing)}>
          <span>Screen Sharing</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>{screenSharing ? 'On' : 'Off'}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
        
        <div className="ubuntu-settings-list-item clickable" onClick={() => setMediaSharing(!mediaSharing)}>
          <span>Media Sharing</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>{mediaSharing ? 'On' : 'Off'}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </div>
    </SettingsPanelWrapper>
  );
}
