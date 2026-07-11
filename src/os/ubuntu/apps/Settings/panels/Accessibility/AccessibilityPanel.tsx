import { useState } from 'react';
import { SettingsPanelWrapper } from '../../components/SettingsPanelWrapper';
import { useSettingsStore } from '../../store/useSettingsStore';

export function AccessibilityPanel() {
  const {
    highContrast, setHighContrast,
    largeText, setLargeText
  } = useSettingsStore();
  const [visualAlerts, setVisualAlerts] = useState(false);
  const [screenKeyboard, setScreenKeyboard] = useState(false);

  const renderToggle = (label: string, checked: boolean, onChange: (v: boolean) => void) => (
    <div className="ubuntu-settings-list-item clickable" onClick={() => onChange(!checked)}>
      <span>{label}</span>
      <div className={`ubuntu-settings-toggle ${checked ? 'checked' : ''}`} style={{ backgroundColor: checked ? 'var(--color-accent)' : 'var(--color-surface-active)' }}>
        <div className="ubuntu-settings-toggle-knob" style={{ transform: checked ? 'translateX(24px)' : 'translateX(0)' }} />
      </div>
    </div>
  );

  return (
    <SettingsPanelWrapper title="Accessibility">
      <div className="ubuntu-settings-section-title" style={{ padding: '0 8px 8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
        Seeing
      </div>
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '24px' }}>
        {renderToggle("High Contrast", highContrast, setHighContrast)}
        {renderToggle("Large Text", largeText, setLargeText)}
      </div>

      <div className="ubuntu-settings-section-title" style={{ padding: '0 8px 8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
        Hearing
      </div>
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '24px' }}>
        {renderToggle("Visual Alerts", visualAlerts, setVisualAlerts)}
      </div>

      <div className="ubuntu-settings-section-title" style={{ padding: '0 8px 8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
        Typing
      </div>
      <div className="ubuntu-settings-list-group">
        {renderToggle("Screen Keyboard", screenKeyboard, setScreenKeyboard)}
      </div>
    </SettingsPanelWrapper>
  );
}
