import { useState, lazy, Suspense } from 'react';
import { useSettingsStore } from './store/useSettingsStore';
import { SettingsSidebar } from './components/SettingsSidebar';
export { SettingsHeaderControls } from './components/SettingsHeaderControls';

const WifiPanel = lazy(() => import('./panels/WifiPanel').then(m => ({ default: m.WifiPanel })));
const SystemPanel = lazy(() => import('./panels/SystemPanel').then(m => ({ default: m.SystemPanel })));
const AccessibilityPanel = lazy(() => import('./panels/AccessibilityPanel').then(m => ({ default: m.AccessibilityPanel })));
const AppearancePanel = lazy(() => import('./panels/AppearancePanel').then(m => ({ default: m.AppearancePanel })));
const AppsPanel = lazy(() => import('./panels/AppsPanel').then(m => ({ default: m.AppsPanel })));
const BluetoothPanel = lazy(() => import('./panels/BluetoothPanel').then(m => ({ default: m.BluetoothPanel })));
const ColorPanel = lazy(() => import('./panels/ColorPanel').then(m => ({ default: m.ColorPanel })));
const DisplaysPanel = lazy(() => import('./panels/DisplaysPanel').then(m => ({ default: m.DisplaysPanel })));
const KeyboardPanel = lazy(() => import('./panels/KeyboardPanel').then(m => ({ default: m.KeyboardPanel })));
const MouseTouchpadPanel = lazy(() => import('./panels/MouseTouchpadPanel').then(m => ({ default: m.MouseTouchpadPanel })));
const MultitaskingPanel = lazy(() => import('./panels/MultitaskingPanel').then(m => ({ default: m.MultitaskingPanel })));
const NetworkPanel = lazy(() => import('./panels/NetworkPanel').then(m => ({ default: m.NetworkPanel })));
const NotificationsPanel = lazy(() => import('./panels/NotificationsPanel').then(m => ({ default: m.NotificationsPanel })));
const OnlineAccountsPanel = lazy(() => import('./panels/OnlineAccountsPanel').then(m => ({ default: m.OnlineAccountsPanel })));
const PowerPanel = lazy(() => import('./panels/PowerPanel').then(m => ({ default: m.PowerPanel })));
const PrintersPanel = lazy(() => import('./panels/PrintersPanel').then(m => ({ default: m.PrintersPanel })));
const PrivacyPanel = lazy(() => import('./panels/PrivacyPanel').then(m => ({ default: m.PrivacyPanel })));
const RemovableMediaPanel = lazy(() => import('./panels/RemovableMediaPanel').then(m => ({ default: m.RemovableMediaPanel })));
const SearchPanel = lazy(() => import('./panels/SearchPanel').then(m => ({ default: m.SearchPanel })));
const SharingPanel = lazy(() => import('./panels/SharingPanel').then(m => ({ default: m.SharingPanel })));
const SoundPanel = lazy(() => import('./panels/SoundPanel').then(m => ({ default: m.SoundPanel })));
const UbuntuDesktopPanel = lazy(() => import('./panels/UbuntuDesktopPanel').then(m => ({ default: m.UbuntuDesktopPanel })));

import './Settings.css';
import './components/SettingsPanelWrapper.css';

export function Settings() {
  const { activePanel } = useSettingsStore();
  const [searchQuery] = useState('');

  return (
    <div className="ubuntu-settings-app">
      <SettingsSidebar searchQuery={searchQuery} />
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
