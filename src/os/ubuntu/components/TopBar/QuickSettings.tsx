import { useHardwareStore } from '../../../../hardware/store/useHardwareStore';
import { useWindowStore } from '../../store/useUbuntuWindowStore';
import { useSystemDialogStore } from '../../store/useSystemDialogStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useState, useEffect, Fragment } from 'react';
import './QuickSettings.css';

interface QuickSettingsProps {
  onClose: () => void;
  isLoginScreen?: boolean;
}

export function QuickSettings({ onClose, isLoginScreen = false }: QuickSettingsProps) {
  const powerOff = useHardwareStore((s) => s.powerOff);
  const openWindow = useWindowStore((s) => s.openWindow);
  const openDialog = useSystemDialogStore((s) => s.openDialog);
  
  const { 
    wifiEnabled: wifiOn, 
    bluetoothEnabled: btOn, 
    airplaneMode: airplane, 
    toggleWifi, 
    toggleBluetooth, 
    toggleAirplaneMode 
  } = useNetworkStore();

  const [darkMode, setDarkMode] = useState(false);
  const [nightLight, setNightLight] = useState(false);
  const [showPowerMenu, setShowPowerMenu] = useState(false);
  const [activePillMenu, setActivePillMenu] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (activePillMenu === 'wifi' || activePillMenu === 'bt') {
      setIsSearching(true);
      const timer = setTimeout(() => setIsSearching(false), 15000);
      return () => clearTimeout(timer);
    }
  }, [activePillMenu]);
  
  const pills = [
    {
      id: 'wifi',
      active: wifiOn,
      title: 'Wi-Fi',
      subtitle: wifiOn ? 'On' : 'Off',
      hasArrow: true,
      onClick: toggleWifi,
      menuItems: [],
      emptyMessage: 'No Wi-Fi networks found',
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
        </svg>
      )
    },
    {
      id: 'bt',
      active: btOn,
      title: 'Bluetooth',
      subtitle: btOn ? 'On' : 'Off',
      hasArrow: true,
      onClick: toggleBluetooth,
      menuItems: [],
      emptyMessage: 'No Bluetooth devices found',
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/>
        </svg>
      )
    },
    {
      id: 'power',
      active: false,
      title: 'Power Mode',
      subtitle: 'Balanced',
      hasArrow: true,
      onClick: () => {},
      menuItems: ['Performance', 'Balanced', 'Power Saver'],
      emptyMessage: '',
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M16 4h-2V2h-4v2H8c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM8 12h8v2H8v-2zm0 4h8v2H8v-2zm0-8h8v2H8V8z" />
        </svg>
      )
    },
    {
      id: 'dark',
      active: darkMode,
      title: 'Dark Style',
      subtitle: darkMode ? 'On' : 'Off',
      hasArrow: false,
      onClick: () => setDarkMode(!darkMode),
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>
        </svg>
      )
    },
    {
      id: 'night',
      active: nightLight,
      title: 'Night Light',
      subtitle: nightLight ? 'On' : 'Off',
      hasArrow: false,
      onClick: () => setNightLight(!nightLight),
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06z" />
        </svg>
      )
    },
    {
      id: 'airplane',
      active: airplane,
      title: 'Airplane Mode',
      subtitle: airplane ? 'On' : 'Off',
      hasArrow: false,
      onClick: toggleAirplaneMode,
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
        </svg>
      )
    }
  ];

  return (
    <div className="quick-settings" onClick={(e) => { e.stopPropagation(); setActivePillMenu(null); setShowPowerMenu(false); }}>
      
      {/* 1. Top Row: Battery & Actions */}
      <div className="qs-top-row">
        <div className="qs-battery-pill">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zM11 20H9v-2h2v2zm0-4H9V9h2v7z" />
          </svg>
          <span>100%</span>
        </div>
        
        <div className="qs-actions-group">
          {!isLoginScreen && (
            <>
              <div className="qs-action-circle" title="Take Screenshot">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                   <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
              </div>
              <div className="qs-action-circle" title="Settings" onClick={() => { openWindow('settings'); onClose(); }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M19.43 12.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49-.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
                </svg>
              </div>
            </>
          )}
          <div className="qs-action-circle" title="Lock Screen">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
            </svg>
          </div>
          <div style={{ position: 'relative' }}>
            {showPowerMenu && (
              <div className="qs-power-menu">
                <div className="qs-power-menu-item" onClick={() => { openDialog('suspend'); onClose(); }}>Suspend</div>
                <div className="qs-power-menu-item" onClick={() => { openDialog('restart'); onClose(); }}>Restart…</div>
                <div className="qs-power-menu-item" onClick={() => { openDialog('power_off'); onClose(); }}>Power Off…</div>
                <div className="qs-power-menu-item" onClick={() => { openDialog('log_out'); onClose(); }}>Log Out…</div>
              </div>
            )}
            <div className="qs-action-circle" onClick={(e) => { e.stopPropagation(); setShowPowerMenu(!showPowerMenu); setActivePillMenu(null); }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sliders Group */}
      <div className="quick-settings__sliders">
        <div className="qs-slider-row">
          <div className="qs-slider-icon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </div>
          <input type="range" className="qs-slider-new" min="0" max="100" defaultValue="50" />
        </div>
        <div className="qs-slider-row">
          <div className="qs-slider-icon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zM11 1h2v3h-2zm0 17h2v3h-2zM3.51 5.92l1.41-1.41 2.12 2.12-1.41 1.41zM17.96 19.46l1.41-1.41 2.12 2.12-1.41 1.41zM1 11h3v2H1zm19 0h3v2h-3zm-2.04-3.54l2.12-2.12 1.41 1.41-2.12 2.12zM4.92 18.04l2.12-2.12 1.41 1.41-2.12 2.12z"/>
            </svg>
          </div>
          <input type="range" className="qs-slider-new" min="0" max="100" defaultValue="80" />
        </div>
      </div>

      {/* 3. Pills Grid */}
      <div className="quick-settings__pills">
        {pills.map((pill, index) => (
          <div key={pill.id} style={{ position: 'relative', zIndex: activePillMenu === pill.id ? 100 : 1 }}>
            <div className={`qs-pill-group ${pill.active ? 'active' : ''}`}>
            <div className="qs-pill-main" onClick={pill.onClick}>
              <div className="qs-pill-icon">{pill.icon}</div>
              <div className="qs-pill-content">
                <div className="qs-pill-title">{pill.title}</div>
                {pill.subtitle && <div className="qs-pill-subtitle">{pill.subtitle}</div>}
              </div>
            </div>
            {pill.hasArrow && (
              <div className="qs-pill-arrow" onClick={(e) => { e.stopPropagation(); setActivePillMenu(activePillMenu === pill.id ? null : pill.id); setShowPowerMenu(false); }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
                </svg>
              </div>
            )}
          </div>
          {activePillMenu === pill.id && (
            <div 
              className="qs-pill-dropdown" 
              onClick={(e) => e.stopPropagation()}
              style={{
                left: index % 2 === 0 ? 0 : 'auto',
                right: index % 2 !== 0 ? 0 : 'auto',
                width: 'calc(200% + 12px)'
              }}
            >
              <div className="qs-pill-dropdown-header">Select {pill.title}</div>
              
              {pill.menuItems && pill.menuItems.length > 0 ? (
                pill.menuItems.map(item => (
                  <div key={item} className="qs-pill-dropdown-item" onClick={() => setActivePillMenu(null)}>
                    {item}
                  </div>
                ))
              ) : (
                <div className="qs-pill-dropdown-empty">
                  {isSearching && (pill.id === 'wifi' || pill.id === 'bt') ? (
                    <div className="qs-searching-spinner">
                      <svg className="qs-spinner" viewBox="0 0 50 50">
                        <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                      </svg>
                      {pill.id === 'wifi' ? 'Searching for Wi-Fi...' : 'Searching for devices...'}
                    </div>
                  ) : (
                    pill.emptyMessage
                  )}
                </div>
              )}
            </div>
          )}
          </div>
        ))}
      </div>

    </div>
  );
}
