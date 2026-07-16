import { useState, Suspense, lazy } from 'react';
import { useClock } from '../../hooks/useClock';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useBattery } from '../../hooks/useBattery';
import { useSettingsStore } from '../../apps/Settings/store/useSettingsStore';
import './TopBar.css';

const QuickSettings = lazy(() => import('./QuickSettings').then(m => ({ default: m.QuickSettings })));
const CalendarMenu = lazy(() => import('./CalendarMenu').then(m => ({ default: m.CalendarMenu })));

export function TopBar({ isLoginScreen = false }: { isLoginScreen?: boolean }) {
  const clock = useClock();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const toggleOverview = useWorkspaceStore((s) => s.toggleOverview);
  const isOverviewOpen = useWorkspaceStore((s) => s.isOverviewOpen);
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const workspaceCount = useWorkspaceStore((s) => s.workspaceCount);
  const wifiEnabled = useNetworkStore((s) => s.wifiEnabled);
  const airplaneMode = useNetworkStore((s) => s.airplaneMode);
  const { level: batteryLevel, isCharging } = useBattery();
  const systemVolume = useSettingsStore((s) => s.systemVolume);

  const getBatteryIcon = () => {
    if (batteryLevel === undefined) return 'battery-level-100-symbolic.svg';
    const level10 = Math.round(batteryLevel / 10) * 10;
    
    if (isCharging) {
      if (level10 === 100) return 'battery-level-100-charged-symbolic.svg';
      return `battery-level-${level10}-charging-symbolic.svg`;
    } else {
      return `battery-level-${level10}-symbolic.svg`;
    }
  };

  const getVolumeIcon = () => {
    if (systemVolume === 0) return 'audio-volume-muted-symbolic.svg';
    if (systemVolume < 33) return 'audio-volume-low-symbolic.svg';
    if (systemVolume < 66) return 'audio-volume-medium-symbolic.svg';
    if (systemVolume <= 100) return 'audio-volume-high-symbolic.svg';
    return 'audio-volume-overamplified-symbolic.svg';
  };

  const getNetworkIcon = () => {
    if (airplaneMode) return 'airplane-mode-symbolic.svg';
    if (!wifiEnabled) return null;
    return 'network-wireless-signal-excellent-symbolic.svg';
  };

  const networkIcon = getNetworkIcon();

  return (
    <header className="topbar" id="topbar">
      {/* Left: Workspace Indicator (GNOME 46) */}
      <div className="topbar__left" style={{ paddingLeft: '8px' }}>
        {!isLoginScreen && (
          <div 
            className={`topbar__workspace-indicator ${isOverviewOpen ? 'topbar__workspace-indicator--active' : ''}`}
            title="Activities"
            onClick={toggleOverview}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: isOverviewOpen 
                ? 'rgba(255,255,255,0.1)' 
                : 'transparent',
              borderRadius: '999px',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
          >
            {Array.from({ length: workspaceCount }, (_, i) => (
              <div
                key={i}
                style={{
                  width: i === activeWorkspace ? '18px' : '6px',
                  height: '6px',
                  background: i === activeWorkspace 
                    ? 'white' 
                    : 'rgba(255,255,255,0.35)',
                  borderRadius: '3px',
                  transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Center: Clock */}
      <div 
        className={`topbar__center ${calendarOpen ? 'active' : ''}`}
        onClick={() => { setCalendarOpen(!calendarOpen); setSettingsOpen(false); }}
        style={{ cursor: 'pointer', padding: '0 8px', borderRadius: '4px', transition: 'background 0.15s' }}
        onMouseEnter={(e) => { if(!calendarOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = calendarOpen ? 'rgba(255,255,255,0.1)' : 'transparent'; }}
      >
        {clock}
      </div>

      {/* Right: System Tray */}
      <div 
        className={`topbar__right ${settingsOpen ? 'active' : ''}`} 
        onClick={() => { setSettingsOpen(!settingsOpen); setCalendarOpen(false); }}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', height: '100%', padding: '0 8px', borderRadius: '4px', transition: 'background 0.15s' }}
        onMouseEnter={(e) => { if(!settingsOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = settingsOpen ? 'rgba(255,255,255,0.1)' : 'transparent'; }}
      >
        <div className="topbar__tray-group">
          {/* Network icon */}
          {networkIcon && (
            <div 
              className="topbar__tray-icon" 
              style={{ WebkitMaskImage: `url('/ubuntu/status/${networkIcon}')` }}
            />
          )}
          {/* Volume icon */}
          <div 
            className="topbar__tray-icon" 
            style={{ WebkitMaskImage: `url('/ubuntu/status/${getVolumeIcon()}')` }}
          />
          {/* Battery icon */}
          <div 
            className="topbar__tray-icon" 
            style={{ WebkitMaskImage: `url('/ubuntu/status/${getBatteryIcon()}')`, width: '18px', height: '18px' }}
          />
        </div>
      </div>
      
      {settingsOpen && (
        <Suspense fallback={null}>
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }} 
            onClick={() => setSettingsOpen(false)}
          />
          <QuickSettings onClose={() => setSettingsOpen(false)} isLoginScreen={isLoginScreen} />
        </Suspense>
      )}

      {calendarOpen && (
        <Suspense fallback={null}>
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }} 
            onClick={() => setCalendarOpen(false)}
          />
          <CalendarMenu onClose={() => setCalendarOpen(false)} />
        </Suspense>
      )}
    </header>
  );
}
