import { useNetworkStore } from '../../../store/useNetworkStore';
import './WifiPanel.css';

export function WifiPanel() {
  const { wifiEnabled, toggleWifi, airplaneMode } = useNetworkStore();

  const handleToggleWifi = () => {
    if (!airplaneMode) {
      toggleWifi();
    }
  };

  return (
    <div className="ubuntu-settings-panel-wrapper">
      <div className="settings-panel">
        
        {/* First Card: Wi-Fi Options */}
        <div className="ubuntu-settings-list-group">
          <div className="ubuntu-settings-list-item">
            <span>Wi-Fi</span>
            <div 
              className={`ubuntu-settings-toggle ${wifiEnabled ? 'checked' : ''} ${airplaneMode ? 'disabled' : ''}`}
              style={{ backgroundColor: wifiEnabled ? 'var(--color-accent)' : undefined }}
              onClick={handleToggleWifi}
            >
              <div className="ubuntu-settings-toggle-knob" />
            </div>
          </div>
          <div className="ubuntu-settings-list-item interactive">
            <span>Saved Networks</span>
            <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
          <div className="ubuntu-settings-list-item interactive">
            <span>Connect to Hidden Network...</span>
            <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
          <div className="ubuntu-settings-list-item interactive">
            <span>Turn On Wi-Fi Hotspot...</span>
            <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>

        {/* Second Card: Airplane Mode */}
        <div className="ubuntu-settings-list-group">
          <div className="ubuntu-settings-list-item">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span>Airplane Mode</span>
              <span style={{ fontSize: '13px', opacity: 0.6, marginTop: '2px' }}>Disables Wi-Fi, Bluetooth and mobile broadband</span>
            </div>
            <div 
              className={`ubuntu-settings-toggle ${airplaneMode ? 'checked' : ''}`}
              style={{ backgroundColor: airplaneMode ? 'var(--color-accent)' : undefined }}
              onClick={() => useNetworkStore.setState({ airplaneMode: !airplaneMode })}
            >
              <div className="ubuntu-settings-toggle-knob" />
            </div>
          </div>
        </div>

        {wifiEnabled ? (
          <>
            <div style={{ fontWeight: 600, marginTop: '8px', fontSize: '14px', marginBottom: '-12px' }}>
              Visible Networks
            </div>
            {/* Third Card: Visible Networks */}
            <div className="ubuntu-settings-list-group">
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '64px', color: 'var(--color-text)', opacity: 0.6 }}>
            <svg width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
              <path d="M12 21L1.5 8.5a15 15 0 0 1 21 0L12 21z" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0' }}>No Wi-Fi Adapter Found</h2>
            <p style={{ fontSize: '14px', margin: 0, opacity: 0.8 }}>Make sure you have a Wi-Fi adapter plugged and turned on</p>
          </div>
        )}

      </div>
    </div>
  );
}
