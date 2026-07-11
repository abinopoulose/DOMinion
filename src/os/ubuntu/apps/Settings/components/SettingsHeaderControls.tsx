
import { useSettingsStore } from '../store/useSettingsStore';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { PANELS } from '../config/panels';

export function SettingsHeaderControls({ windowId: _windowId }: { windowId: string }) {
  const { activePanel, systemSubPage, keyboardSubPage, privacySubPage, goBackFromSubPage, isSearchActive, setIsSearchActive } = useSettingsStore();
  const panel = PANELS.find(p => p.id === activePanel);
  const { bluetoothEnabled, toggleBluetooth, airplaneMode, wifiEnabled } = useNetworkStore();

  let headerTitle = panel?.label;
  let onBack: (() => void) | undefined = undefined;

  if (activePanel === 'system' && systemSubPage !== 'root') {
    const systemSubpageTitles: Record<string, string> = {
      'region-language': 'Region & Language',
      'date-time': 'Date & Time',
      'users': 'Users',
      'remote-desktop': 'Remote Desktop',
      'secure-shell': 'Secure Shell',
      'about': 'About'
    };
    headerTitle = systemSubpageTitles[systemSubPage] || headerTitle;
    onBack = goBackFromSubPage;
  } else if (activePanel === 'keyboard' && keyboardSubPage === 'shortcuts') {
    headerTitle = 'Keyboard Shortcuts';
    onBack = goBackFromSubPage;
  } else if (activePanel === 'privacy' && privacySubPage !== 'root') {
    const privacySubpageTitles: Record<string, string> = {
      'connectivity': 'Connectivity',
      'screen-lock': 'Screen Lock',
      'location': 'Location',
      'file-history': 'File History & Trash',
      'diagnostics': 'Diagnostics',
      'device-security': 'Device Security'
    };
    headerTitle = privacySubpageTitles[privacySubPage] || headerTitle;
    onBack = goBackFromSubPage;
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'stretch', marginLeft: '-10px' }}>
      <div style={{ 
        width: 280, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        position: 'relative', 
        borderRight: '1px solid rgba(0,0,0,0.08)',
        flexShrink: 0 
      }}>
        <div 
          onClick={() => setIsSearchActive(!isSearchActive)}
          style={{ 
            position: 'absolute', 
            left: 16, 
            opacity: isSearchActive ? 1 : 0.5, 
            display: 'flex',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            backgroundColor: isSearchActive ? 'rgba(0,0,0,0.05)' : 'transparent',
            WebkitAppRegion: 'no-drag'
          } as any}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Settings</span>
        <div style={{ position: 'absolute', right: 16, display: 'flex' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
        </div>
      </div>
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        paddingRight: '10px',
        position: 'relative'
      }}>
        {onBack && (
          <div 
            style={{ 
              position: 'absolute', 
              left: 16, 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              opacity: 0.7,
              WebkitAppRegion: 'no-drag',
              padding: '4px'
            } as any}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onBack?.();
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </div>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{headerTitle}</span>
          {activePanel === 'wifi' && (
            <span style={{ fontSize: 12, opacity: 0.6, marginTop: '-2px' }}>
              {wifiEnabled ? 'Connected' : 'Unavailable'}
            </span>
          )}
        </div>
        
        {activePanel === 'bluetooth' && (
          <div style={{ position: 'absolute', right: 8, display: 'flex', alignItems: 'center' }}>
            <div 
              className={`ubuntu-settings-toggle ${bluetoothEnabled ? 'checked' : ''} ${airplaneMode ? 'disabled' : ''}`}
              style={{ 
                backgroundColor: bluetoothEnabled ? 'var(--color-accent)' : undefined,
                WebkitAppRegion: 'no-drag',
                pointerEvents: 'auto'
              } as any}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                if (!airplaneMode) toggleBluetooth();
              }}
            >
              <div className="ubuntu-settings-toggle-knob" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
