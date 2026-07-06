import { useState } from 'react';
import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';
import { SettingsDropdown } from '../components/SettingsDropdown';

type PrivacySubPage = 'root' | 'location' | 'camera' | 'microphone' | 'screen-lock';

export function PrivacyPanel() {
  const [subPage, setSubPage] = useState<PrivacySubPage>('root');
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [autoLock, setAutoLock] = useState(true);

  if (subPage !== 'root') {
    const backButton = (
      <button className="ubuntu-settings-back-button" onClick={() => setSubPage('root')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Privacy & Security
      </button>
    );

    let content = null;
    let title = '';

    if (subPage === 'location') {
      title = 'Location Services';
      content = (
        <div className="ubuntu-settings-list-group">
          <div className="ubuntu-settings-list-item clickable" onClick={() => setLocationEnabled(!locationEnabled)}>
            <span>Location Services</span>
            <div className={`ubuntu-settings-toggle ${locationEnabled ? 'checked' : ''}`} style={{ backgroundColor: locationEnabled ? 'var(--color-accent)' : 'var(--color-surface-active)' }}>
              <div className="ubuntu-settings-toggle-knob" style={{ transform: locationEnabled ? 'translateX(24px)' : 'translateX(0)' }} />
            </div>
          </div>
        </div>
      );
    } else if (subPage === 'camera') {
      title = 'Camera';
      content = (
        <div className="ubuntu-settings-list-group">
          <div className="ubuntu-settings-list-item clickable" onClick={() => setCameraEnabled(!cameraEnabled)}>
            <span>Camera Access</span>
            <div className={`ubuntu-settings-toggle ${cameraEnabled ? 'checked' : ''}`} style={{ backgroundColor: cameraEnabled ? 'var(--color-accent)' : 'var(--color-surface-active)' }}>
              <div className="ubuntu-settings-toggle-knob" style={{ transform: cameraEnabled ? 'translateX(24px)' : 'translateX(0)' }} />
            </div>
          </div>
        </div>
      );
    } else if (subPage === 'microphone') {
      title = 'Microphone';
      content = (
        <div className="ubuntu-settings-list-group">
          <div className="ubuntu-settings-list-item clickable" onClick={() => setMicEnabled(!micEnabled)}>
            <span>Microphone Access</span>
            <div className={`ubuntu-settings-toggle ${micEnabled ? 'checked' : ''}`} style={{ backgroundColor: micEnabled ? 'var(--color-accent)' : 'var(--color-surface-active)' }}>
              <div className="ubuntu-settings-toggle-knob" style={{ transform: micEnabled ? 'translateX(24px)' : 'translateX(0)' }} />
            </div>
          </div>
        </div>
      );
    } else if (subPage === 'screen-lock') {
      title = 'Screen Lock';
      content = (
        <div className="ubuntu-settings-list-group">
          <div className="ubuntu-settings-list-item" style={{ overflow: 'visible' }}>
            <span>Blank Screen Delay</span>
            <SettingsDropdown
              value="5"
              onChange={() => {}}
              options={[
                { value: '1', label: '1 minute' },
                { value: '5', label: '5 minutes' },
                { value: 'never', label: 'Never' }
              ]}
            />
          </div>
          <div className="ubuntu-settings-list-item clickable" onClick={() => setAutoLock(!autoLock)}>
            <span>Automatic Screen Lock</span>
            <div className={`ubuntu-settings-toggle ${autoLock ? 'checked' : ''}`} style={{ backgroundColor: autoLock ? 'var(--color-accent)' : 'var(--color-surface-active)' }}>
              <div className="ubuntu-settings-toggle-knob" style={{ transform: autoLock ? 'translateX(24px)' : 'translateX(0)' }} />
            </div>
          </div>
        </div>
      );
    }

    return (
      <SettingsPanelWrapper title={title} leftHeaderContent={backButton}>
        {content}
      </SettingsPanelWrapper>
    );
  }

  const renderNav = (label: string, page: PrivacySubPage, status?: string) => (
    <div className="ubuntu-settings-list-item clickable" onClick={() => setSubPage(page)}>
      <span>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {status && <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>{status}</span>}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  );

  return (
    <SettingsPanelWrapper title="Privacy & Security">
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '24px' }}>
        {renderNav("Location Services", "location", locationEnabled ? "On" : "Off")}
        {renderNav("Camera", "camera", cameraEnabled ? "On" : "Off")}
        {renderNav("Microphone", "microphone", micEnabled ? "On" : "Off")}
      </div>
      
      <div className="ubuntu-settings-list-group">
        {renderNav("Screen Lock", "screen-lock")}
      </div>
    </SettingsPanelWrapper>
  );
}
