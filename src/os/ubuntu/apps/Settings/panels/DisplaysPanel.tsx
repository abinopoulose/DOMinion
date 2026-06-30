import { useSettingsStore } from '../store/useSettingsStore';
import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';
import './DisplaysPanel.css';

export function DisplaysPanel() {
  const { nightLight, setNightLight } = useSettingsStore();

  return (
    <SettingsPanelWrapper title="Displays">
      <div className="displays-preview-container">
        <div className="displays-preview-monitor">
          <div className="displays-preview-screen">
            <span className="displays-preview-number">1</span>
          </div>
          <div className="displays-preview-stand"></div>
          <div className="displays-preview-base"></div>
        </div>
      </div>

      <div className="ubuntu-settings-list-group">
        <div className="ubuntu-settings-list-item">
          <span>Resolution</span>
          <select className="ubuntu-settings-select" disabled>
            <option>1920 x 1080 (16:9)</option>
          </select>
        </div>
        <div className="ubuntu-settings-list-item">
          <span>Refresh Rate</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>60.00 Hz</span>
        </div>
      </div>

      <div className="ubuntu-settings-section-title" style={{ padding: '24px 8px 8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
        Night Light
      </div>

      <div className="ubuntu-settings-list-group">
        <div className="ubuntu-settings-list-item clickable" onClick={() => setNightLight(!nightLight)}>
          <span>Night Light</span>
          <div className={`ubuntu-settings-toggle ${nightLight ? 'checked' : ''}`} style={{ backgroundColor: nightLight ? 'var(--color-accent)' : 'var(--color-surface-active)' }}>
            <div className="ubuntu-settings-toggle-knob" style={{ transform: nightLight ? 'translateX(24px)' : 'translateX(0)' }} />
          </div>
        </div>
      </div>
      <p style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
        Makes the screen color warmer. This can help to prevent eye strain and sleeplessness.
      </p>
    </SettingsPanelWrapper>
  );
}
