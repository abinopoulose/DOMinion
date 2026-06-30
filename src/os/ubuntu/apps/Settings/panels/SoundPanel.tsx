import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';
import { useSettingsStore } from '../store/useSettingsStore';
import './SoundPanel.css';

export function SoundPanel() {
  const { systemVolume, setSystemVolume, inputVolume, setInputVolume } = useSettingsStore();

  return (
    <SettingsPanelWrapper title="Sound">
      <div className="ubuntu-settings-section-title" style={{ padding: '0 8px 8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
        Output
      </div>
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '24px' }}>
        <div className="ubuntu-settings-list-item">
          <span>Output Device</span>
          <select className="ubuntu-settings-select" defaultValue="dummy">
            <option value="dummy">Dummy Output</option>
          </select>
        </div>
        <div className="ubuntu-settings-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '16px', gap: '16px' }}>
          <span style={{ fontWeight: '500' }}>System Volume</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)' }}>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            </svg>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={systemVolume} 
              onChange={(e) => setSystemVolume(parseInt(e.target.value))}
              className="sound-volume-slider"
            />
          </div>
        </div>
      </div>

      <div className="ubuntu-settings-section-title" style={{ padding: '0 8px 8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
        Input
      </div>
      <div className="ubuntu-settings-list-group">
        <div className="ubuntu-settings-list-item">
          <span>Input Device</span>
          <select className="ubuntu-settings-select" defaultValue="webcam">
            <option value="webcam">Webcam Microphone</option>
          </select>
        </div>
        <div className="ubuntu-settings-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '16px', gap: '16px' }}>
          <span style={{ fontWeight: '500' }}>Input Volume</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)' }}>
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={inputVolume} 
              onChange={(e) => setInputVolume(parseInt(e.target.value))}
              className="sound-volume-slider"
            />
          </div>
        </div>
      </div>
    </SettingsPanelWrapper>
  );
}
