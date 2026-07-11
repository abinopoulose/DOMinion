import { Suspense } from 'react';
import { useSettingsStore } from './store/useSettingsStore';
import { SettingsSidebar } from './components/SettingsSidebar';
export { SettingsHeaderControls } from './components/SettingsHeaderControls';

import { WifiPanel } from './panels/Wifi/WifiPanel';
import { SystemPanel } from './panels/System/SystemPanel';
import { AccessibilityPanel } from './panels/Accessibility/AccessibilityPanel';
import { AppearancePanel } from './panels/Appearance/AppearancePanel';
import { AppsPanel } from './panels/Apps/AppsPanel';
import { BluetoothPanel } from './panels/Bluetooth/BluetoothPanel';
import { ColorPanel } from './panels/Color/ColorPanel';
import { DisplaysPanel } from './panels/Displays/DisplaysPanel';
import { KeyboardPanel } from './panels/Keyboard/KeyboardPanel';
import { MouseTouchpadPanel } from './panels/MouseTouchpad/MouseTouchpadPanel';
import { MultitaskingPanel } from './panels/Multitasking/MultitaskingPanel';
import { NetworkPanel } from './panels/Network/NetworkPanel';
import { NotificationsPanel } from './panels/Notifications/NotificationsPanel';
import { OnlineAccountsPanel } from './panels/OnlineAccounts/OnlineAccountsPanel';
import { PowerPanel } from './panels/Power/PowerPanel';
import { PrintersPanel } from './panels/Printers/PrintersPanel';
import { PrivacyPanel } from './panels/Privacy/PrivacyPanel';
import { RemovableMediaPanel } from './panels/RemovableMedia/RemovableMediaPanel';
import { SearchPanel } from './panels/Search/SearchPanel';
import { SharingPanel } from './panels/Sharing/SharingPanel';
import { SoundPanel } from './panels/Sound/SoundPanel';
import { UbuntuDesktopPanel } from './panels/UbuntuDesktop/UbuntuDesktopPanel';

import './Settings.css';
import './components/SettingsPanelWrapper.css';

export function Settings() {
  const { activePanel } = useSettingsStore();

  return (
    <div className="ubuntu-settings-app">
      <SettingsSidebar />
      <main className="ubuntu-settings-content">
        <Suspense fallback={<div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 24, height: 24, border: '2px solid #ccc', borderTop: '2px solid var(--color-accent, #E95420)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>}>
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
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', opacity: 0.5 }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p style={{ margin: 0, opacity: 0.8 }}>Panel content will be implemented in subsequent tasks.</p>
            </div>
          )}
        </Suspense>
      </main>
    </div>
  );
}
