import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';
import { useNetworkStore } from '../../../store/useNetworkStore';
import './WifiPanel.css';

export function WifiPanel() {
  const { wifiEnabled, toggleWifi } = useNetworkStore();

  const toggleSwitch = (
    <div 
      className={`ubuntu-settings-toggle ${wifiEnabled ? 'checked' : ''}`}
      style={{ backgroundColor: wifiEnabled ? 'var(--color-accent)' : undefined }}
      onClick={toggleWifi}
    >
      <div className="ubuntu-settings-toggle-knob" style={{ transform: wifiEnabled ? 'translateX(20px)' : 'translateX(0)' }} />
    </div>
  );

  return (
    <SettingsPanelWrapper title="Wi-Fi" rightHeaderContent={toggleSwitch}>
      {wifiEnabled ? (
        <div className="ubuntu-wifi-empty-state">
           <h3 className="ubuntu-wifi-empty-title">Visible Networks</h3>
           <p className="ubuntu-wifi-empty-subtitle">Searching for networks...</p>
        </div>
      ) : (
        <div className="ubuntu-wifi-empty-state">
          <div className="ubuntu-wifi-empty-icon">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
              <line x1="2" y1="2" x2="22" y2="22" />
              <path d="M8.5 16.5a5 5 0 0 1 7 0" />
              <path d="M5 13a10 10 0 0 1 14 0" />
              <path d="M2 9.5a15 15 0 0 1 20 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
          </div>
          <h3 className="ubuntu-wifi-empty-title">Wi-Fi is Off</h3>
          <p className="ubuntu-wifi-empty-subtitle">
            Turn on Wi-Fi to connect to networks.
          </p>
        </div>
      )}
    </SettingsPanelWrapper>
  );
}
