import { useNetworkStore } from '../../../../store/useNetworkStore';
import { useState, useEffect } from 'react';
import './WifiPanel.css';

export function WifiPanel() {
  const { wifiEnabled, toggleWifi, airplaneMode } = useNetworkStore();
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (wifiEnabled) {
      setIsScanning(true);
      const timer = setTimeout(() => {
        setIsScanning(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setIsScanning(false);
    }
  }, [wifiEnabled]);

  const handleScan = () => {
    if (!isScanning) {
      setIsScanning(true);
      setTimeout(() => {
        setIsScanning(false);
      }, 5000);
    }
  };

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontWeight: 600, fontSize: '14px', marginBottom: '-12px', marginTop: '8px' }}>
              <span>Visible Networks</span>
              {isScanning ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" style={{ animation: 'spin 1s linear infinite' }}>
                  <line x1="12" y1="2" x2="12" y2="6"></line>
                  <line x1="12" y1="18" x2="12" y2="22"></line>
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                  <line x1="2" y1="12" x2="6" y2="12"></line>
                  <line x1="18" y1="12" x2="22" y2="12"></line>
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                  <line x1="16.24" y1="4.93" x2="19.07" y2="7.76"></line>
                  <style>{`
                    @keyframes spin {
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
                </svg>
              ) : (
                <svg onClick={handleScan} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" style={{ cursor: 'pointer' }}>
                  <path d="M21 2v6h-6"></path>
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                  <path d="M3 22v-6h6"></path>
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                </svg>
              )}
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
