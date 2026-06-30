import { useState } from 'react';
import { useSettingsStore } from './store/useSettingsStore';
import type { SettingsPanel } from './store/useSettingsStore';
import { WifiPanel } from './panels/WifiPanel';
import { SystemPanel } from './panels/SystemPanel';
import { AccessibilityPanel } from './panels/AccessibilityPanel';
import { AppearancePanel } from './panels/AppearancePanel';
import { AppsPanel } from './panels/AppsPanel';
import { BluetoothPanel } from './panels/BluetoothPanel';
import { ColorPanel } from './panels/ColorPanel';
import { DisplaysPanel } from './panels/DisplaysPanel';
import { KeyboardPanel } from './panels/KeyboardPanel';
import { MouseTouchpadPanel } from './panels/MouseTouchpadPanel';
import { MultitaskingPanel } from './panels/MultitaskingPanel';
import { NetworkPanel } from './panels/NetworkPanel';
import { NotificationsPanel } from './panels/NotificationsPanel';
import { OnlineAccountsPanel } from './panels/OnlineAccountsPanel';
import { PowerPanel } from './panels/PowerPanel';
import { PrintersPanel } from './panels/PrintersPanel';
import { PrivacyPanel } from './panels/PrivacyPanel';
import { RemovableMediaPanel } from './panels/RemovableMediaPanel';
import { SearchPanel } from './panels/SearchPanel';
import { SharingPanel } from './panels/SharingPanel';
import { SoundPanel } from './panels/SoundPanel';
import { UbuntuDesktopPanel } from './panels/UbuntuDesktopPanel';
import './Settings.css';

const PANELS: { id: SettingsPanel; label: string }[] = [
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'network', label: 'Network' },
  { id: 'bluetooth', label: 'Bluetooth' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'ubuntu-desktop', label: 'Ubuntu Desktop' },
  { id: 'search', label: 'Search' },
  { id: 'multitasking', label: 'Multitasking' },
  { id: 'apps', label: 'Apps' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'privacy', label: 'Privacy & Security' },
  { id: 'online-accounts', label: 'Online Accounts' },
  { id: 'sharing', label: 'Sharing' },
  { id: 'sound', label: 'Sound' },
  { id: 'power', label: 'Power' },
  { id: 'displays', label: 'Displays' },
  { id: 'mouse', label: 'Mouse & Touchpad' },
  { id: 'keyboard', label: 'Keyboard' },
  { id: 'printers', label: 'Printers' },
  { id: 'removable-media', label: 'Removable Media' },
  { id: 'color', label: 'Color' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'system', label: 'System' },
];

const getIconForPanel = (id: SettingsPanel) => {
  let iconContent = null;
  switch (id) {
    case 'wifi': iconContent = <><path d="M5 12.55a11 11 0 0 1 14.08 0 M1.42 9a16 16 0 0 1 21.16 0 M8.53 16.11a6 6 0 0 1 6.95 0 M12 20h.01" /></>; break;
    case 'network': iconContent = <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>; break;
    case 'bluetooth': iconContent = <path d="m6.5 6.5 11 11L12 23V1l5.5 5.5-11 11" />; break;
    case 'appearance': iconContent = <><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></>; break;
    case 'ubuntu-desktop': iconContent = <><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>; break;
    case 'search': iconContent = <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>; break;
    case 'multitasking': iconContent = <><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></>; break;
    case 'apps': iconContent = <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>; break;
    case 'notifications': iconContent = <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>; break;
    case 'privacy': iconContent = <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>; break;
    case 'online-accounts': iconContent = <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>; break;
    case 'sharing': iconContent = <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>; break;
    case 'sound': iconContent = <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></>; break;
    case 'power': iconContent = <><rect x="2" y="7" width="16" height="10" rx="2" ry="2"/><line x1="22" y1="11" x2="22" y2="13"/></>; break;
    case 'displays': iconContent = <><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>; break;
    case 'mouse': iconContent = <><rect x="5" y="2" width="14" height="20" rx="7"/><path d="M12 2v6"/></>; break;
    case 'keyboard': iconContent = <><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><path d="M6 8h.001"/><path d="M10 8h.001"/><path d="M14 8h.001"/><path d="M18 8h.001"/><path d="M8 12h.001"/><path d="M12 12h.001"/><path d="M16 12h.001"/><path d="M7 16h10"/></>; break;
    case 'printers': iconContent = <><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>; break;
    case 'removable-media': iconContent = <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></>; break;
    case 'color': iconContent = <><path d="m14 4 6 6"/><path d="M21 7.235a3.003 3.003 0 0 0-4.235-4.235L3 16.765V21h4.235L21 7.235z"/><path d="m2 22 2-2"/></>; break;
    case 'accessibility': iconContent = <><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="13"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="12" y1="13" x2="9" y2="20"/><line x1="12" y1="13" x2="15" y2="20"/></>; break;
    case 'system': iconContent = <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>; break;
    default: iconContent = <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />;
  }

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
      {iconContent}
    </svg>
  );
};

export function Settings() {
  const { activePanel, setActivePanel } = useSettingsStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPanels = PANELS.filter(panel => 
    panel.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="ubuntu-settings-app">
      <aside className="ubuntu-settings-sidebar">
        <div className="ubuntu-settings-search">
          <svg className="ubuntu-settings-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Search" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <ul className="ubuntu-settings-sidebar-list">
          {filteredPanels.map((panel) => (
            <li 
              key={panel.id} 
              className={`ubuntu-settings-sidebar-item ${activePanel === panel.id ? 'active' : ''}`}
              onClick={() => setActivePanel(panel.id)}
            >
              <div className="ubuntu-settings-sidebar-item-content">
                {getIconForPanel(panel.id)}
                <span>{panel.label}</span>
              </div>
            </li>
          ))}
        </ul>
      </aside>
      <main className="ubuntu-settings-content">
        {activePanel === 'wifi' ? (
          <WifiPanel />
        ) : activePanel === 'network' ? (
          <NetworkPanel />
        ) : activePanel === 'notifications' ? (
          <NotificationsPanel />
        ) : activePanel === 'online-accounts' ? (
          <OnlineAccountsPanel />
        ) : activePanel === 'power' ? (
          <PowerPanel />
        ) : activePanel === 'printers' ? (
          <PrintersPanel />
        ) : activePanel === 'privacy' ? (
          <PrivacyPanel />
        ) : activePanel === 'removable-media' ? (
          <RemovableMediaPanel />
        ) : activePanel === 'search' ? (
          <SearchPanel />
        ) : activePanel === 'sharing' ? (
          <SharingPanel />
        ) : activePanel === 'sound' ? (
          <SoundPanel />
        ) : activePanel === 'ubuntu-desktop' ? (
          <UbuntuDesktopPanel />
        ) : activePanel === 'accessibility' ? (
          <AccessibilityPanel />
        ) : activePanel === 'apps' ? (
          <AppsPanel />
        ) : activePanel === 'bluetooth' ? (
          <BluetoothPanel />
        ) : activePanel === 'color' ? (
          <ColorPanel />
        ) : activePanel === 'displays' ? (
          <DisplaysPanel />
        ) : activePanel === 'keyboard' ? (
          <KeyboardPanel />
        ) : activePanel === 'mouse' ? (
          <MouseTouchpadPanel />
        ) : activePanel === 'multitasking' ? (
          <MultitaskingPanel />
        ) : activePanel === 'appearance' ? (
          <AppearancePanel />
        ) : activePanel === 'system' ? (
          <SystemPanel />
        ) : (
          <div className="ubuntu-settings-panel-placeholder">
            <h1>{PANELS.find(p => p.id === activePanel)?.label}</h1>
            <p>Panel content will be implemented in subsequent tasks.</p>
          </div>
        )}
      </main>
    </div>
  );
}
