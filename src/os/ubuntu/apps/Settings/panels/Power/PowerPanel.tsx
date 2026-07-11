import { SettingsPanelWrapper } from '../../components/SettingsPanelWrapper';
import { SettingsDropdown } from '../../components/SettingsDropdown';
import { useSettingsStore } from '../../store/useSettingsStore';
import './PowerPanel.css';

import { useBattery } from '../../../../hooks/useBattery';

export function PowerPanel() {
  const { powerMode, setPowerMode, screenBlank, setScreenBlank } = useSettingsStore();
  const { level: batteryLevel, isCharging } = useBattery();

  return (
    <SettingsPanelWrapper title="Power">
      <div className="ubuntu-settings-section-title" style={{ padding: '0 8px 8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
        Power Mode
      </div>
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '24px' }}>
        <div className="ubuntu-settings-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '16px', gap: '16px' }}>
          
          <label className="power-radio-container">
            <input 
              type="radio" 
              name="powerMode" 
              value="performance" 
              checked={powerMode === 'performance'} 
              onChange={() => setPowerMode('performance')}
            />
            <div className="power-radio-content">
              <span style={{ fontWeight: '500' }}>Performance</span>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                High performance and power usage.
              </span>
            </div>
          </label>
          
          <label className="power-radio-container">
            <input 
              type="radio" 
              name="powerMode" 
              value="balanced" 
              checked={powerMode === 'balanced'} 
              onChange={() => setPowerMode('balanced')}
            />
            <div className="power-radio-content">
              <span style={{ fontWeight: '500' }}>Balanced</span>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Standard performance and power usage.
              </span>
            </div>
          </label>

          <label className="power-radio-container">
            <input 
              type="radio" 
              name="powerMode" 
              value="power-saver" 
              checked={powerMode === 'power-saver'} 
              onChange={() => setPowerMode('power-saver')}
            />
            <div className="power-radio-content">
              <span style={{ fontWeight: '500' }}>Power Saver</span>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Reduced performance and power usage.
              </span>
            </div>
          </label>
          
        </div>
      </div>

      <div className="ubuntu-settings-section-title" style={{ padding: '0 8px 8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
        Battery
      </div>
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '24px' }}>
        <div className="ubuntu-settings-list-item" style={{ cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ color: 'var(--color-text-secondary)' }}>
              <path d="M15.5 5h-7C7.67 5 7 5.67 7 6.5v13c0 .83.67 1.5 1.5 1.5h7c.83 0 1.5-.67 1.5-1.5v-13C17 5.67 16.33 5 15.5 5z" fill="currentColor" opacity="0.3" stroke="none" />
              <path d="M10 3h4v2h-4V3z" fill="currentColor" opacity="0.3" stroke="none" />
              <rect x="8.5" y={19.5 - 13 * ((batteryLevel ?? 100) / 100)} width="7" height={13 * ((batteryLevel ?? 100) / 100)} fill="currentColor" stroke="none" />
              {isCharging && (
                <polygon points="13 7 9 13 11.5 13 11 18 15 11.5 12.5 11.5" fill="var(--color-accent)" stroke="none" />
              )}
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '500' }}>Main Battery</span>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                {batteryLevel === null ? 'Discharging' : isCharging ? (batteryLevel === 100 ? 'Fully Charged' : 'Charging') : 'Discharging'}
              </span>
            </div>
          </div>
          <span style={{ fontWeight: 'bold' }}>{batteryLevel ?? 85}%</span>
        </div>
      </div>

      <div className="ubuntu-settings-section-title" style={{ padding: '0 8px 8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
        Power Saving
      </div>
      <div className="ubuntu-settings-list-group">
        <div className="ubuntu-settings-list-item" style={{ overflow: 'visible' }}>
          <span>Screen Blank</span>
          <SettingsDropdown 
            value={screenBlank}
            onChange={(val) => setScreenBlank(val)}
            options={[
              { value: '1', label: '1 minute' },
              { value: '2', label: '2 minutes' },
              { value: '3', label: '3 minutes' },
              { value: '4', label: '4 minutes' },
              { value: '5', label: '5 minutes' },
              { value: '10', label: '10 minutes' },
              { value: '15', label: '15 minutes' },
              { value: 'never', label: 'Never' },
            ]}
          />
        </div>
      </div>
    </SettingsPanelWrapper>
  );
}
