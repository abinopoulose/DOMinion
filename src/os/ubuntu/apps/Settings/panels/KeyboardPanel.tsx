import { useState } from 'react';
import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';
import { useSettingsStore } from '../store/useSettingsStore';

export function KeyboardPanel() {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { switchDesktopShortcut, switchAppShortcut, setSwitchDesktopShortcut, setSwitchAppShortcut } = useSettingsStore();

  if (showShortcuts) {
    const backButton = (
      <button className="ubuntu-settings-back-button" onClick={() => setShowShortcuts(false)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>
    );

    return (
      <SettingsPanelWrapper title="Keyboard Shortcuts" leftHeaderContent={backButton}>
        <div className="ubuntu-settings-list-group">
          <div className="ubuntu-settings-list-item">
            <span>Open Terminal</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>Ctrl + Alt + T</span>
          </div>
          <div className="ubuntu-settings-list-item">
            <span>Close Window</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>Alt + F4</span>
          </div>
          <div className="ubuntu-settings-list-item">
            <span>Switch Applications</span>
            <select
              value={switchAppShortcut}
              onChange={(e) => setSwitchAppShortcut(e.target.value)}
              style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '4px' }}
            >
              <option value="alt+tab">Alt + Tab</option>
              <option value="super+tab">Super + Tab</option>
              <option value="ctrl+tab">Ctrl + Tab</option>
            </select>
          </div>
          <div className="ubuntu-settings-list-item">
            <span>Switch Desktop</span>
            <select
              value={switchDesktopShortcut}
              onChange={(e) => setSwitchDesktopShortcut(e.target.value)}
              style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '4px' }}
            >
              <option value="ctrl+alt+arrow">Ctrl + Alt + Arrow</option>
              <option value="super+arrow">Super + Arrow</option>
              <option value="alt+arrow">Alt + Arrow</option>
            </select>
          </div>
          <div className="ubuntu-settings-list-item">
            <span>Lock Screen</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>Super + L</span>
          </div>
        </div>
      </SettingsPanelWrapper>
    );
  }

  return (
    <SettingsPanelWrapper title="Keyboard">
      <div className="ubuntu-settings-section-title" style={{ padding: '0 8px 8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
        Input Sources
      </div>
      
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '24px' }}>
        <div className="ubuntu-settings-list-item">
          <span>English (US)</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </div>
      </div>

      <div className="ubuntu-settings-section-title" style={{ padding: '0 8px 8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
        Keyboard Shortcuts
      </div>

      <div className="ubuntu-settings-list-group">
        <div className="ubuntu-settings-list-item clickable" onClick={() => setShowShortcuts(true)}>
          <span>View and Customize Shortcuts</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </SettingsPanelWrapper>
  );
}
