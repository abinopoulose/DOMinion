import React, { useState } from 'react';
import { SettingsPanelWrapper } from '../../components/SettingsPanelWrapper';
import { useSettingsStore, type SystemSubPage } from '../../store/useSettingsStore';
import './SystemPanel.css';

// Import subpages
import { DateTimePage } from './DateTimePage';
import { AboutPage } from './AboutPage';
import { UsersPage } from './UsersPage';
import { RegionLanguagePage } from './RegionLanguagePage';

const SYSTEM_PAGES: { id: SystemSubPage; label: string; subtitle: string; icon: React.ReactNode }[] = [
  { id: 'region-language', label: 'Region & Language', subtitle: 'System language and localization', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> },
  { id: 'date-time', label: 'Date & Time', subtitle: 'Time zone and clock settings', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { id: 'users', label: 'Users', subtitle: 'Add and remove accounts, change password', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { id: 'remote-desktop', label: 'Remote Desktop', subtitle: 'Allow this device to be used remotely', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
  { id: 'secure-shell', label: 'Secure Shell', subtitle: 'SSH network access', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg> },
  { id: 'about', label: 'About', subtitle: 'Hardware details and software versions', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> },
];

async function performFactoryReset() {
  // 1. Clear all IndexedDB databases
  if (window.indexedDB && indexedDB.databases) {
    try {
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
        }
      }
    } catch (_) {
      // Fallback: delete known database names
      const knownDbs = ['ubuntu-idb-storage', 'keyval-store'];
      knownDbs.forEach(name => indexedDB.deleteDatabase(name));
    }
  }

  // 2. Clear localStorage
  localStorage.clear();

  // 3. Clear sessionStorage
  sessionStorage.clear();

  // 4. Unregister all service workers
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    }
  } catch (e) {
    console.warn('Failed to unregister service workers:', e);
  }

  // 5. Clear caches
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
      }
    }
  } catch (e) {
    console.warn('Failed to clear caches:', e);
  }

  // 6. Reload the page to start fresh
  window.location.reload();
}

export function SystemPanel() {
  const { systemSubPage, setSystemSubPage } = useSettingsStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(-1);

  const handleDownloadRemainingFiles = async () => {
    if (downloadProgress >= 0) return;
    setDownloadProgress(0);

    const assets = [
      '/favicon.svg',
      '/windows/icons/downloads.ico',
      '/windows/icons/Recyle Bin full.ico',
      '/windows/icons/pictures.ico',
      '/windows/icons/documents.ico',
      '/windows/icons/3D.ico',
      '/windows/icons/hard disk.ico',
      '/windows/icons/This PC.ico',
      '/windows/icons/desktop.ico',
      '/windows/icons/videos.ico',
      '/windows/icons/Recyle Bin.ico',
      '/windows/icons/music.ico',
      '/windows/icons/USB.ico',
      '/windows/icons/folder.ico',
      '/icons.svg',
      '/ubuntu/vfs_seed.json',
      '/ubuntu/icons/calculator-app.png',
      '/ubuntu/icons/text-x-generic.png',
      '/ubuntu/icons/user-home.png',
      '/ubuntu/icons/browser.svg',
      '/ubuntu/icons/text-x-generic.png',
      '/ubuntu/icons/folder.png',
      '/ubuntu/icons/terminal-app.png',
      '/ubuntu/icons/text-x-generic.png',
      '/ubuntu/icons/user-trash.png',
      '/ubuntu/icons/system-settings.png',
      '/ubuntu/icons/clock-app.png',
      '/ubuntu/wallpapers/ubuntu-24-wallpaper.png',
      '/ubuntu/wallpapers/mount_wallpaper.jpg',
      '/ubuntu/wallpapers/ubuntu_wallpaper.jpg',
      '/ubuntu/settings/workspaces_on_all_display.png',
      '/ubuntu/settings/active_screen_edges.png',
      '/ubuntu/settings/workspaces_on_primary_display_only.png',
      '/ubuntu/settings/hot_corner.png',
      '/ubuntu/icons/folder-remote.png',
      '/ubuntu/icons/video-x-generic.png',
      '/ubuntu/icons/folder-new.png',
      '/ubuntu/icons/application-epub+zip.png',
      '/ubuntu/icons/x-office-document.png',
      '/ubuntu/icons/root-terminal-app.png',
      '/ubuntu/icons/system-settings.png',
      '/ubuntu/icons/folder-pictures.png',
      '/ubuntu/icons/application-x-gzip.png',
      '/ubuntu/icons/folder-templates.png',
      '/ubuntu/icons/terminal-app.png',
      '/ubuntu/icons/folder-music.png',
      '/ubuntu/icons/folder-download.png',
      '/ubuntu/icons/folder-documents.png',
      '/ubuntu/icons/user-home.png',
      '/ubuntu/icons/x-office-presentation.png',
      '/ubuntu/icons/application-x-zip.png',
      '/ubuntu/icons/audio-x-generic.png',
      '/ubuntu/icons/folder-open.png',
      '/ubuntu/icons/folder-publicshare.png',
      '/ubuntu/icons/user-trash-full.png',
      '/ubuntu/icons/folder-videos.png',
      '/ubuntu/icons/application-pdf.png',
      '/ubuntu/icons/text-x-generic.png',
      '/ubuntu/icons/folder-dropbox.png',
      '/ubuntu/icons/image-x-generic.png',
      '/ubuntu/icons/clock-app.png',
      '/ubuntu/icons/preferences-system-time.png',
      '/ubuntu/icons/user-trash.png',
      '/ubuntu/icons/user-desktop.png',
      '/ubuntu/icons/calculator-app.png',
      '/ubuntu/icons/folder.png',
      '/ubuntu/icons/x-office-spreadsheet.png',
      '/ubuntu/icons/preferences-system-brightness-lock.png',
      '/sw.js',
      '/src/App.tsx',
      '/src/hardware/hardwareConfig.ts',
      '/src/hardware/components/post/POST.tsx',
      '/src/hardware/components/post/POST.css',
      '/src/hardware/components/grub/Grub.css',
      '/src/hardware/components/grub/Grub.tsx',
      '/src/hardware/components/bios/BIOS.css',
      '/src/hardware/components/bios/BIOS.tsx',
      '/src/hardware/store/useHardwareStore.ts',
      '/src/index.css',
      '/src/App.css',
      '/src/main.tsx',
      '/src/config/accounts.ts',
      '/src/config/branding.ts',
      '/src/os/windows/fs/pathResolver.ts',
      '/src/os/windows/fs/operations.ts',
      '/src/os/windows/fs/types.ts',
      '/src/os/windows/fs/windowsSeed.ts',
      '/src/os/windows/components/Desktop/WindowsDesktop.tsx',
      '/src/os/windows/components/Desktop/WindowsDesktop.css',
      '/src/os/windows/components/Login/WindowsLogin.css',
      '/src/os/windows/components/Login/WindowsLogin.tsx',
      '/src/os/windows/assets/wallpapers/win-wallpaper-1.jpg',
      '/src/os/windows/store/useWindowsAuthStore.ts',
      '/src/os/windows/store/useWindowsVFSStore.ts',
      '/src/os/windows/store/persistence.ts',
      '/src/os/ubuntu/hooks/useWindowDrag.ts',
      '/src/os/ubuntu/hooks/useBattery.ts',
      '/src/os/ubuntu/hooks/useContextMenu.ts',
      '/src/os/ubuntu/hooks/useSelectionBox.ts',
      '/src/os/ubuntu/hooks/useDockScroll.ts',
      '/src/os/ubuntu/hooks/useWindowResize.tsx',
      '/src/os/ubuntu/hooks/useClock.ts',
      '/src/os/ubuntu/types/index.ts',
      '/src/os/ubuntu/types/window.ts',
      '/src/os/ubuntu/fs/inode.ts',
      '/src/os/ubuntu/fs/index.ts',
      '/src/os/ubuntu/fs/inodeCompat.ts',
      '/src/os/ubuntu/fs/etcSeed.ts',
      '/src/os/ubuntu/fs/permissions.ts',
      '/src/os/ubuntu/fs/authSeed.ts',
      '/src/os/ubuntu/fs/pathResolver.ts',
      '/src/os/ubuntu/fs/operations.ts',
      '/src/os/ubuntu/fs/fd.ts',
      '/src/os/ubuntu/fs/types.ts',
      '/src/os/ubuntu/fs/seed.ts',
      '/src/os/ubuntu/fs/virtualDevices.ts',
      '/src/os/ubuntu/fs/inodeOperations.ts',
      '/src/os/ubuntu/fs/vfsDb.ts',
      '/src/os/ubuntu/utils/iconResolver.ts',
      '/src/os/ubuntu/utils/dragGhost.ts',
      '/src/os/ubuntu/utils/passwordHasher.ts',
      '/src/os/ubuntu/components/TopBar/CalendarMenu.css',
      '/src/os/ubuntu/components/TopBar/CalendarMenu.tsx',
      '/src/os/ubuntu/components/TopBar/TopBar.tsx',
      '/src/os/ubuntu/components/TopBar/QuickSettings.tsx',
      '/src/os/ubuntu/components/TopBar/TopBar.css',
      '/src/os/ubuntu/components/TopBar/QuickSettings.css',
      '/src/os/ubuntu/components/Window/Window.tsx',
      '/src/os/ubuntu/components/Window/TitleBar.tsx',
      '/src/os/ubuntu/components/Window/Window.css',
      '/src/os/ubuntu/components/WorkspaceOverview/WorkspaceOverview.tsx',
      '/src/os/ubuntu/components/WorkspaceOverview/WorkspaceOverview.css',
      '/src/os/ubuntu/components/Desktop/Desktop.css',
      '/src/os/ubuntu/components/Desktop/Desktop.tsx',
      '/src/os/ubuntu/components/Notifications/useNotificationStore.ts',
      '/src/os/ubuntu/components/Notifications/NotificationPopup.css',
      '/src/os/ubuntu/components/Notifications/NotificationPopup.tsx',
      '/src/os/ubuntu/components/SystemDialog/SystemDialog.css',
      '/src/os/ubuntu/components/SystemDialog/PolkitDialog.tsx',
      '/src/os/ubuntu/components/SystemDialog/SystemDialog.tsx',
      '/src/os/ubuntu/components/TrashConfirmDialog/TrashConfirmDialog.tsx',
      '/src/os/ubuntu/components/ContextMenu/ContextMenu.tsx',
      '/src/os/ubuntu/components/ContextMenu/ContextMenu.css',
      '/src/os/ubuntu/components/WorkspaceOSD/WorkspaceOSD.css',
      '/src/os/ubuntu/components/WorkspaceOSD/WorkspaceOSD.tsx',
      '/src/os/ubuntu/components/Login/UbuntuLogin.css',
      '/src/os/ubuntu/components/Login/UbuntuLogin.tsx',
      '/src/os/ubuntu/components/Dock/DockIcon.tsx',
      '/src/os/ubuntu/components/Dock/Dock.tsx',
      '/src/os/ubuntu/components/Dock/Dock.css',
      '/src/os/ubuntu/apps/Settings/Settings.css',
      '/src/os/ubuntu/apps/Settings/panels/OnlineAccountsPanel.tsx',
      '/src/os/ubuntu/apps/Settings/panels/PowerPanel.tsx',
      '/src/os/ubuntu/apps/Settings/panels/WifiPanel.css',
      '/src/os/ubuntu/apps/Settings/panels/ColorPanel.tsx',
      '/src/os/ubuntu/apps/Settings/panels/RemovableMediaPanel.tsx',
      '/src/os/ubuntu/apps/Settings/panels/MultitaskingPanel.tsx',
      '/src/os/ubuntu/apps/Settings/panels/PrivacyPanel.tsx',
      '/src/os/ubuntu/apps/Settings/panels/SearchPanel.tsx',
      '/src/os/ubuntu/apps/Settings/panels/UbuntuDesktopPanel.tsx',
      '/src/os/ubuntu/apps/Settings/panels/NotificationsPanel.tsx',
      '/src/os/ubuntu/apps/Settings/panels/SoundPanel.tsx',
      '/src/os/ubuntu/apps/Settings/panels/AppearancePanel.css',
      '/src/os/ubuntu/apps/Settings/panels/DisplaysPanel.tsx',
      '/src/os/ubuntu/apps/Settings/panels/PrintersPanel.tsx',
      '/src/os/ubuntu/apps/Settings/panels/SystemPanel.css',
      '/src/os/ubuntu/apps/Settings/panels/AppsPanel.css',
      '/src/os/ubuntu/apps/Settings/panels/AppsPanel.tsx',
      '/src/os/ubuntu/apps/Settings/panels/NetworkPanel.tsx',
      '/src/os/ubuntu/apps/Settings/panels/WifiPanel.tsx',
      '/src/os/ubuntu/apps/Settings/panels/SharingPanel.tsx',
      '/src/os/ubuntu/apps/Settings/panels/SoundPanel.css',
      '/src/os/ubuntu/apps/Settings/panels/MouseTouchpadPanel.tsx',
      '/src/os/ubuntu/apps/Settings/panels/AppearancePanel.tsx',
      '/src/os/ubuntu/apps/Settings/panels/KeyboardPanel.tsx',
      '/src/os/ubuntu/apps/Settings/panels/SystemPanel.tsx',
      '/src/os/ubuntu/apps/Settings/panels/PowerPanel.css',
      '/src/os/ubuntu/apps/Settings/panels/DisplaysPanel.css',
      '/src/os/ubuntu/apps/Settings/panels/BluetoothPanel.tsx',
      '/src/os/ubuntu/apps/Settings/panels/MouseTouchpadPanel.css',
      '/src/os/ubuntu/apps/Settings/panels/MultitaskingPanel.css',
      '/src/os/ubuntu/apps/Settings/panels/AccessibilityPanel.tsx',
      '/src/os/ubuntu/apps/Settings/Settings.tsx',
      '/src/os/ubuntu/apps/Settings/components/SettingsPanelWrapper.tsx',
      '/src/os/ubuntu/apps/Settings/components/SettingsDropdown.tsx',
      '/src/os/ubuntu/apps/Settings/components/SettingsPanelWrapper.css',
      '/src/os/ubuntu/apps/Settings/components/SettingsHeaderControls.tsx',
      '/src/os/ubuntu/apps/Settings/components/SettingsDropdown.css',
      '/src/os/ubuntu/apps/Settings/components/SettingsSidebar.tsx',
      '/src/os/ubuntu/apps/Settings/config/panels.tsx',
      '/src/os/ubuntu/apps/Settings/store/useSettingsStore.ts',
      '/src/os/ubuntu/apps/Browser/BrowserTab.tsx',
      '/src/os/ubuntu/apps/Browser/Browser.tsx',
      '/src/os/ubuntu/apps/Browser/Browser.css',
      '/src/os/ubuntu/apps/Browser/BrowserContent.tsx',
      '/src/os/ubuntu/apps/Clock/views/TimerView.tsx',
      '/src/os/ubuntu/apps/Clock/views/StopwatchView.tsx',
      '/src/os/ubuntu/apps/Clock/views/WorldClocksView.tsx',
      '/src/os/ubuntu/apps/Clock/views/AlarmsView.tsx',
      '/src/os/ubuntu/apps/Clock/hooks/useTimer.ts',
      '/src/os/ubuntu/apps/Clock/hooks/useStopwatch.ts',
      '/src/os/ubuntu/apps/Clock/hooks/useClockDaemon.ts',
      '/src/os/ubuntu/apps/Clock/ClockApp.css',
      '/src/os/ubuntu/apps/Clock/components/AnalogClock.tsx',
      '/src/os/ubuntu/apps/Clock/components/AlarmItem.tsx',
      '/src/os/ubuntu/apps/Clock/components/HeaderTabs.tsx',
      '/src/os/ubuntu/apps/Clock/components/LapTable.tsx',
      '/src/os/ubuntu/apps/Clock/ClockApp.tsx',
      '/src/os/ubuntu/apps/Clock/store/useStopwatchStore.ts',
      '/src/os/ubuntu/apps/Clock/store/useTimerStore.ts',
      '/src/os/ubuntu/apps/Clock/store/useAlarmStore.ts',
      '/src/os/ubuntu/apps/Clock/store/useWorldClockStore.ts',
      '/src/os/ubuntu/apps/TextEditor/TextEditorHeaderControls.tsx',
      '/src/os/ubuntu/apps/TextEditor/useTextEditor.ts',
      '/src/os/ubuntu/apps/TextEditor/TextEditor.css',
      '/src/os/ubuntu/apps/TextEditor/TextEditor.tsx',
      '/src/os/ubuntu/apps/Terminal/commandParser/index.ts',
      '/src/os/ubuntu/apps/Terminal/commandParser/types.ts',
      '/src/os/ubuntu/apps/Terminal/commandParser/parseArgs.ts',
      '/src/os/ubuntu/apps/Terminal/commandParser/parser.ts',
      '/src/os/ubuntu/apps/Terminal/autocomplete.ts',
      '/src/os/ubuntu/apps/Terminal/Terminal.tsx',
      '/src/os/ubuntu/apps/Terminal/commands/sysInfo.ts',
      '/src/os/ubuntu/apps/Terminal/commands/index.ts',
      '/src/os/ubuntu/apps/Terminal/commands/fileOps.ts',
      '/src/os/ubuntu/apps/Terminal/commands/navigation.ts',
      '/src/os/ubuntu/apps/Terminal/commands/su.ts',
      '/src/os/ubuntu/apps/Terminal/commands/types.ts',
      '/src/os/ubuntu/apps/Terminal/commands/misc.ts',
      '/src/os/ubuntu/apps/Terminal/commands/nano.ts',
      '/src/os/ubuntu/apps/Terminal/commands/sudo.ts',
      '/src/os/ubuntu/apps/Terminal/commands/userMgmt.ts',
      '/src/os/ubuntu/apps/Terminal/commands/utils/index.ts',
      '/src/os/ubuntu/apps/Terminal/commands/utils/walkTree.ts',
      '/src/os/ubuntu/apps/Terminal/commands/shellOps.ts',
      '/src/os/ubuntu/apps/Terminal/commands/textOps.ts',
      '/src/os/ubuntu/apps/Terminal/NanoEditor.tsx',
      '/src/os/ubuntu/apps/Terminal/TerminalOutput.tsx',
      '/src/os/ubuntu/apps/Terminal/Terminal.css',
      '/src/os/ubuntu/apps/Terminal/TerminalInput.tsx',
      '/src/os/ubuntu/apps/Calculator/Calculator.css',
      '/src/os/ubuntu/apps/Calculator/Calculator.tsx',
      '/src/os/ubuntu/apps/Calculator/useCalculator.ts',
      '/src/os/ubuntu/apps/FileManager/FileManagerHeaderControls.tsx',
      '/src/os/ubuntu/apps/FileManager/Sidebar.tsx',
      '/src/os/ubuntu/apps/FileManager/FileManager.css',
      '/src/os/ubuntu/apps/FileManager/FileManager.tsx',
      '/src/os/ubuntu/apps/FileManager/FileGrid.tsx',
      '/src/os/ubuntu/apps/FileManager/FileList.tsx',
      '/src/os/ubuntu/apps/FileManager/BreadcrumbBar.tsx',
      '/src/os/ubuntu/services/sudoersParser.ts',
      '/src/os/ubuntu/services/sudoService.ts',
      '/src/os/ubuntu/store/useUbuntuVFSStore.ts',
      '/src/os/ubuntu/store/index.ts',
      '/src/os/ubuntu/store/useNetworkStore.ts',
      '/src/os/ubuntu/store/useUbuntuDesktopStore.ts',
      '/src/os/ubuntu/store/useUbuntuAuthStore.ts',
      '/src/os/ubuntu/store/useSystemDialogStore.ts',
      '/src/os/ubuntu/store/useWorkspaceStore.ts',
      '/src/os/ubuntu/store/persistence.ts',
      '/src/os/ubuntu/store/useUbuntuWindowStore.ts',
    ];

    try {
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/sw.js');
      }

      if ('caches' in window) {
        const cache = await caches.open('ubuntu-assets');
        let loaded = 0;
        for (const asset of assets) {
          try {
             await cache.add(asset);
          } catch(e) {} 
          loaded++;
          setDownloadProgress(Math.round((loaded / assets.length) * 100));
          await new Promise(r => setTimeout(r, 5)); // artificial delay for smooth progress bar
        }
      } else {
        let loaded = 0;
        for (const asset of assets) {
          try {
             await fetch(asset, { cache: 'force-cache' });
          } catch(e) {}
          loaded++;
          setDownloadProgress(Math.round((loaded / assets.length) * 100));
          await new Promise(r => setTimeout(r, 5));
        }
      }
    } catch (e) {
      console.error('Failed to download assets:', e);
    } finally {
      setTimeout(() => setDownloadProgress(-1), 2000);
    }
  };

  if (systemSubPage !== 'root') {
    
    let content = null;

    if (systemSubPage === 'region-language') {
      content = <RegionLanguagePage />;
    } else if (systemSubPage === 'date-time') {
      content = <DateTimePage />;
    } else if (systemSubPage === 'users') {
      content = <UsersPage />;
    } else if (systemSubPage === 'about') {
      content = <AboutPage />;
    } else {
      content = (
        <div className="ubuntu-settings-panel-empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginBottom: '16px' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <h2 style={{ fontSize: '20px', fontWeight: 'normal', margin: '0 0 8px 0', color: 'var(--color-text-primary)' }}>Disabled</h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>This feature is disabled by the host system.</p>
        </div>
      );
    }

    return (
      <SettingsPanelWrapper>
        {content}
      </SettingsPanelWrapper>
    );
  }

  return (
    <SettingsPanelWrapper>
      <div className="ubuntu-settings-list-group">
        {SYSTEM_PAGES.map((page) => (
          <div 
            key={page.id} 
            className="ubuntu-settings-list-item interactive"
            onClick={() => setSystemSubPage(page.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ opacity: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {page.icon}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '15px' }}>{page.label}</span>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', opacity: 0.7 }}>{page.subtitle}</span>
              </div>
            </div>
            <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        ))}
      </div>

      <div className="ubuntu-settings-list-group" style={{ marginTop: '24px' }}>
        <div className="ubuntu-settings-list-item interactive">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ opacity: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
              </svg>
            </div>
            <span style={{ fontSize: '15px' }}>Software Updates</span>
          </div>
          <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </div>
        <div 
          className="ubuntu-settings-list-item interactive" 
          onClick={() => setShowResetConfirm(true)}
          style={{ color: '#e5534b' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ opacity: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </div>
            <span style={{ fontSize: '15px' }}>Factory Reset</span>
          </div>
        </div>

        <div 
          className="ubuntu-settings-list-item interactive" 
          onClick={handleDownloadRemainingFiles}
          style={{ cursor: downloadProgress >= 0 ? 'default' : 'pointer', opacity: downloadProgress >= 0 ? 0.7 : 1 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            <div style={{ opacity: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {downloadProgress === 100 ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" color="var(--color-accent)">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' }}>
              <span style={{ fontSize: '15px' }}>
                {downloadProgress === 100 ? 'All files downloaded' : downloadProgress >= 0 ? `Downloading remaining files... ${downloadProgress}%` : 'Download Remaining Files'}
              </span>
              {downloadProgress >= 0 && (
                <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${downloadProgress}%`, height: '100%', background: 'var(--color-accent)', transition: 'width 0.1s linear' }} />
                </div>
              )}
            </div>
          </div>
          {downloadProgress >= 0 && downloadProgress < 100 && (
            <div style={{ 
              width: '16px', 
              height: '16px', 
              border: '2px solid rgba(255,255,255,0.2)', 
              borderTop: '2px solid var(--color-accent)', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite' 
            }} />
          )}
        </div>
      </div>

      {showResetConfirm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'var(--bg-window, #ffffff)',
            color: 'var(--color-text-primary, #000)',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>Factory Reset</h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--color-text-secondary, #666)' }}>
              This will erase all data, including installed apps, files, and settings. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setShowResetConfirm(false)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.2)', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: '14px' }}
              >
                Cancel
              </button>
              <button 
                onClick={performFactoryReset}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#e5534b', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
              >
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </SettingsPanelWrapper>
  );
}
