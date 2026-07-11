
import { SettingsPanelWrapper } from '../../components/SettingsPanelWrapper';
import { SettingsDropdown } from '../../components/SettingsDropdown';
import { useSettingsStore } from '../../store/useSettingsStore';

export function KeyboardPanel() {
  const { keyboardSubPage, switchDesktopShortcut, switchAppShortcut, setSwitchDesktopShortcut, setSwitchAppShortcut, setKeyboardSubPage } = useSettingsStore();
  const showShortcuts = keyboardSubPage === 'shortcuts';

  if (showShortcuts) {
    return (
      <SettingsPanelWrapper>
        <div className="ubuntu-settings-list-group">
          <div className="ubuntu-settings-list-item">
            <span>Open Terminal</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>Ctrl + Alt + T</span>
          </div>
          <div className="ubuntu-settings-list-item">
            <span>Close Window</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>Alt + F4</span>
          </div>
          <div className="ubuntu-settings-list-item" style={{ overflow: 'visible' }}>
            <span>Switch Applications</span>
            <SettingsDropdown
              value={switchAppShortcut}
              onChange={(val) => setSwitchAppShortcut(val)}
              options={[
                { value: 'alt+tab', label: 'Alt + Tab' },
                { value: 'super+tab', label: 'Super + Tab' },
                { value: 'ctrl+tab', label: 'Ctrl + Tab' },
              ]}
            />
          </div>
          <div className="ubuntu-settings-list-item" style={{ overflow: 'visible' }}>
            <span>Switch Desktop</span>
            <SettingsDropdown
              value={switchDesktopShortcut}
              onChange={(val) => setSwitchDesktopShortcut(val)}
              options={[
                { value: 'ctrl+alt+arrow', label: 'Ctrl + Alt + Arrow' },
                { value: 'super+arrow', label: 'Super + Arrow' },
                { value: 'alt+arrow', label: 'Alt + Arrow' },
              ]}
            />
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
    <SettingsPanelWrapper>
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
        <div className="ubuntu-settings-list-item clickable" onClick={() => setKeyboardSubPage('shortcuts')}>
          <span>View and Customize Shortcuts</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </SettingsPanelWrapper>
  );
}
