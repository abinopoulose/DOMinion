import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';
import { useSettingsStore } from '../store/useSettingsStore';
import { hardwareConfig } from '../../../../../hardware/hardwareConfig';
import { useState, useEffect } from 'react';
import type { SystemSubPage } from '../store/useSettingsStore';
import './SystemPanel.css';

const SYSTEM_PAGES: { id: SystemSubPage; label: string }[] = [
  { id: 'region-language', label: 'Region & Language' },
  { id: 'date-time', label: 'Date & Time' },
  { id: 'users', label: 'Users' },
  { id: 'remote-desktop', label: 'Remote Desktop' },
  { id: 'secure-shell', label: 'Secure Shell' },
  { id: 'about', label: 'About' },
];

function DateTimeSubPage() {
  const [autoTime, setAutoTime] = useState(true);
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ubuntu-settings-list-group">
      <div className="ubuntu-settings-list-item clickable" onClick={() => setAutoTime(!autoTime)}>
        <span>Automatic Date & Time</span>
        <div className={`ubuntu-settings-toggle ${autoTime ? 'checked' : ''}`} style={{ backgroundColor: autoTime ? 'var(--color-accent)' : 'var(--color-surface-active)' }}>
          <div className="ubuntu-settings-toggle-knob" style={{ transform: autoTime ? 'translateX(24px)' : 'translateX(0)' }} />
        </div>
      </div>
      <div className="ubuntu-settings-list-item">
        <span>Time</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>{time}</span>
      </div>
    </div>
  );
}

export function SystemPanel() {
  const { systemSubPage, setSystemSubPage, goBackFromSubPage } = useSettingsStore();

  if (systemSubPage !== 'root') {
    const pageTitle = SYSTEM_PAGES.find((p) => p.id === systemSubPage)?.label || 'System';
    
    const backButton = (
      <button className="ubuntu-settings-back-button" onClick={goBackFromSubPage}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>
    );

    let content = null;

    if (systemSubPage === 'region-language') {
      content = (
        <div className="ubuntu-settings-list-group">
          <div className="ubuntu-settings-list-item">
            <span>Language</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>English (United States)</span>
          </div>
          <div className="ubuntu-settings-list-item">
            <span>Formats</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>United States</span>
          </div>
        </div>
      );
    } else if (systemSubPage === 'date-time') {
      content = <DateTimeSubPage />;
    } else if (systemSubPage === 'users') {
      content = (
        <div className="ubuntu-settings-list-group">
          <div className="ubuntu-settings-list-item" style={{ padding: '16px', gap: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px' }}>
              U
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontWeight: '500', fontSize: '18px' }}>Ubuntu User</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>Administrator</span>
            </div>
          </div>
        </div>
      );
    } else if (systemSubPage === 'about') {
      content = (
        <div className="ubuntu-settings-list-group">
          <div className="ubuntu-settings-list-item" style={{ flexDirection: 'column', alignItems: 'center', padding: '32px 16px', gap: '16px' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent)' }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
            <h2 style={{ margin: 0 }}>Ubuntu 24.04 LTS</h2>
          </div>
          <div className="ubuntu-settings-list-item">
            <span>Hardware Model</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>{hardwareConfig.deviceModel}</span>
          </div>
          <div className="ubuntu-settings-list-item">
            <span>Memory</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>{hardwareConfig.memory}</span>
          </div>
          <div className="ubuntu-settings-list-item">
            <span>Processor</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>{hardwareConfig.processor}</span>
          </div>
          <div className="ubuntu-settings-list-item">
            <span>Graphics</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>{hardwareConfig.graphics}</span>
          </div>
          <div className="ubuntu-settings-list-item">
            <span>Disk Capacity</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>{hardwareConfig.diskCapacity}</span>
          </div>
          <div className="ubuntu-settings-list-item">
            <span>OS Type</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>64-bit</span>
          </div>
          <div className="ubuntu-settings-list-item">
            <span>Windowing System</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>Wayland</span>
          </div>
        </div>
      );
    } else {
      content = (
        <div className="ubuntu-settings-panel-empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginBottom: '16px' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <h2 style={{ fontSize: '20px', fontWeight: 'normal', margin: '0 0 8px 0', color: 'var(--color-text-primary)' }}>Disabled</h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>This feature is disabled by the host system.</p>
        </div>
      );
    }

    return (
      <SettingsPanelWrapper title={pageTitle} leftHeaderContent={backButton}>
        {content}

      </SettingsPanelWrapper>
    );
  }

  return (
    <SettingsPanelWrapper title="System">
      <div className="ubuntu-settings-list-group">
        {SYSTEM_PAGES.map((page) => (
          <div 
            key={page.id} 
            className="ubuntu-settings-list-item clickable"
            onClick={() => setSystemSubPage(page.id)}
          >
            <span>{page.label}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        ))}
      </div>
    </SettingsPanelWrapper>
  );
}
