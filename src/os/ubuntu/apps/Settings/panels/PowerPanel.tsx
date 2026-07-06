
import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';
import { useSettingsStore } from '../store/useSettingsStore';
import './PowerPanel.css';

import { useBattery } from '../../hooks/useBattery';

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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)' }}>
              <rect x="2" y="7" width="16" height="10" rx="2" ry="2" />
              <line x1="22" y1="11" x2="22" y2="13" />
              <rect x="4" y="9" width={(batteryLevel ?? 85) / 10} height="6" fill="currentColor" stroke="none" />
              {isCharging && <polygon points="11 6 7 12 13 12 9 18" fill="currentColor" stroke="none" />}
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
        <div className="ubuntu-settings-list-item">
          <span>Screen Blank</span>
          <select 
            className="ubuntu-settings-select" 
            value={screenBlank}
            onChange={(e) => setScreenBlank(e.target.value)}
          >
            <option value="1">1 minute</option>
            <option value="2">2 minutes</option>
            <option value="3">3 minutes</option>
            <option value="4">4 minutes</option>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="never">Never</option>
          </select>
        </div>
      </div>
    </SettingsPanelWrapper>
  );
}
