import { useState } from 'react';
import { useClock } from '../../hooks/useClock';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useBattery } from '../../hooks/useBattery';

import { QuickSettings } from './QuickSettings';
import './TopBar.css';

export function TopBar({ isLoginScreen = false }: { isLoginScreen?: boolean }) {
  const clock = useClock();
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const toggleOverview = useWorkspaceStore((s) => s.toggleOverview);
  const isOverviewOpen = useWorkspaceStore((s) => s.isOverviewOpen);
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const workspaceCount = useWorkspaceStore((s) => s.workspaceCount);
  const wifiEnabled = useNetworkStore((s) => s.wifiEnabled);
  const { level: batteryLevel, isCharging } = useBattery();

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
                ? 'rgba(255,255,255,0.2)' 
                : 'rgba(255,255,255,0.08)',
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
      <div className="topbar__center" style={{ fontWeight: 600 }}>
        {clock}
      </div>

      {/* Right: System Tray */}
      <div 
        className={`topbar__right ${settingsOpen ? 'active' : ''}`} 
        onClick={() => setSettingsOpen(!settingsOpen)}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', height: '100%', padding: '0 8px', borderRadius: '4px', transition: 'background 0.15s' }}
        onMouseEnter={(e) => { if(!settingsOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = settingsOpen ? 'rgba(255,255,255,0.1)' : 'transparent'; }}
      >
        <div className="topbar__tray-group">
          {/* Wi-Fi icon */}
          {wifiEnabled ? (
            <svg className="topbar__tray-icon" viewBox="0 0 24 24">
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
            </svg>
          ) : (
            <svg className="topbar__tray-icon" viewBox="0 0 24 24" style={{ opacity: 0.5 }}>
              <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2" />
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
            </svg>
          )}
          {/* Volume icon */}
          <svg className="topbar__tray-icon" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
          {/* Battery icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, marginRight: '2px' }}>
              {batteryLevel !== null ? `${batteryLevel}%` : '100%'}
            </span>
            <svg className="topbar__tray-icon" viewBox="0 0 24 24">
              <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" fill="currentColor" opacity="0.3" />
              {/* Fill level based on battery percentage */}
              <clipPath id="battery-clip">
                <rect x="0" y={22 - (18 * ((batteryLevel ?? 100) / 100))} width="24" height={18 * ((batteryLevel ?? 100) / 100)} />
              </clipPath>
              <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" clipPath="url(#battery-clip)" />
              {isCharging && (
                <polygon points="11 6 7 12 13 12 9 18" fill="var(--color-accent)" stroke="none" />
              )}
            </svg>
          </div>
        </div>
      </div>
      
      {settingsOpen && (
        <>
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }} 
            onClick={() => setSettingsOpen(false)}
          />
          <QuickSettings onClose={() => setSettingsOpen(false)} isLoginScreen={isLoginScreen} />
        </>
      )}
    </header>
  );
}
