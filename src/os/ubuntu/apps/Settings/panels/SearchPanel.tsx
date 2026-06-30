import { useState } from 'react';
import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';

export function SearchPanel() {
  const [toggles, setToggles] = useState({
    apps: true,
    files: true,
    calculator: true,
    terminal: true,
    calendar: false,
    settings: true,
  });

  const toggleItem = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderToggle = (key: keyof typeof toggles, label: string) => {
    const isChecked = toggles[key];
    return (
      <div className="ubuntu-settings-list-item clickable" onClick={() => toggleItem(key)}>
        <span>{label}</span>
        <div className={`ubuntu-settings-toggle ${isChecked ? 'checked' : ''}`} style={{ backgroundColor: isChecked ? 'var(--color-accent)' : 'var(--color-surface-active)' }}>
          <div className="ubuntu-settings-toggle-knob" style={{ transform: isChecked ? 'translateX(24px)' : 'translateX(0)' }} />
        </div>
      </div>
    );
  };

  return (
    <SettingsPanelWrapper title="Search">
      <div className="ubuntu-settings-section-title" style={{ padding: '0 8px 8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
        Search Locations
      </div>
      
      <div className="ubuntu-settings-list-group">
        {renderToggle('apps', 'Applications')}
        {renderToggle('files', 'Files')}
        {renderToggle('calculator', 'Calculator')}
        {renderToggle('terminal', 'Terminal')}
        {renderToggle('settings', 'Settings')}
        {renderToggle('calendar', 'Calendar')}
      </div>
    </SettingsPanelWrapper>
  );
}
