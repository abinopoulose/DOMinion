import { useCallback, useEffect } from 'react'
import { useHardwareStore } from './hardware/store/useHardwareStore'
import { useUbuntuAuthStore } from './os/ubuntu/store/useUbuntuAuthStore'
import { useWindowsAuthStore } from './os/windows/store/useWindowsAuthStore'
import { useSettingsStore } from './os/ubuntu/apps/Settings/store/useSettingsStore'

// Hardware components
import { POST } from './hardware/components/post/POST'
import { BIOS } from './hardware/components/bios/BIOS'
import { Grub } from './hardware/components/grub/Grub'

// OS components
import { UbuntuLogin } from './os/ubuntu/components/Login/UbuntuLogin'
import { WindowsLogin } from './os/windows/components/Login/WindowsLogin'
import { WindowsDesktop } from './os/windows/components/Desktop/WindowsDesktop'

// Ubuntu UI
import { useWindowStore } from './os/ubuntu/store/useUbuntuWindowStore'
import { useWorkspaceStore } from './os/ubuntu/store/useWorkspaceStore'
import { TopBar } from './os/ubuntu/components/TopBar/TopBar'
import { Desktop } from './os/ubuntu/components/Desktop/Desktop'
import { Dock } from './os/ubuntu/components/Dock/Dock'
import { WorkspaceOverview } from './os/ubuntu/components/WorkspaceOverview/WorkspaceOverview'
import { Window } from './os/ubuntu/components/Window/Window'
import terminalIcon from './os/ubuntu/assets/icons/terminal.svg'
import fileManagerIcon from './os/ubuntu/assets/icons/file-manager.svg'
import browserIcon from './os/ubuntu/assets/icons/browser.svg'
import textIcon from './os/ubuntu/assets/icons/text.svg'
import settingsIcon from './os/ubuntu/assets/icons/settings.svg'
import { Terminal, TerminalHeaderControls } from './os/ubuntu/apps/Terminal/Terminal'
import { FileManager } from './os/ubuntu/apps/FileManager/FileManager'
import { Browser } from './os/ubuntu/apps/Browser/Browser'
import { TextEditor } from './os/ubuntu/apps/TextEditor/TextEditor'
import { Settings } from './os/ubuntu/apps/Settings/Settings'
import { SystemDialog } from './os/ubuntu/components/SystemDialog/SystemDialog'
import './App.css'

const APP_META: Record<string, { title: string; icon: string; defaultSize: { width: number; height: number } }> = {
  terminal: { title: 'Terminal', icon: terminalIcon, defaultSize: { width: 680, height: 440 } },
  'file-manager': { title: 'Files', icon: fileManagerIcon, defaultSize: { width: 750, height: 500 } },
  browser: { title: 'Browser', icon: browserIcon, defaultSize: { width: 900, height: 600 } },
  'text-editor': { title: 'Text Editor', icon: textIcon, defaultSize: { width: 600, height: 500 } },
  settings: { title: 'Settings', icon: settingsIcon, defaultSize: { width: 900, height: 600 } },
}

function MockAppContent({ appId, windowId }: { appId: string, windowId: string }) {
  if (appId === 'terminal') return <Terminal windowId={windowId} />;
  if (appId === 'file-manager') return <FileManager windowId={windowId} />;
  if (appId === 'browser') return <Browser windowId={windowId} />;
  if (appId === 'text-editor') return <TextEditor windowId={windowId} />;
  if (appId === 'settings') return <Settings />;
  return null;
}

function UbuntuEnvironment() {
  const currentUser = useUbuntuAuthStore((s) => s.currentUser);
  const openWindow = useWindowStore((s) => s.openWindow);
  const unfocusAll = useWindowStore((s) => s.unfocusAll);
  const restoreWindow = useWindowStore((s) => s.restoreWindow);
  
  const allWindows = useWindowStore((s) => s.windows);
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const nextWorkspace = useWorkspaceStore((s) => s.nextWorkspace);
  const prevWorkspace = useWorkspaceStore((s) => s.prevWorkspace);
  const toggleOverview = useWorkspaceStore((s) => s.toggleOverview);

  // Filter windows to only show those belonging to the active workspace
  const windowList = allWindows.filter((w) => w.workspaceId === activeWorkspace);

  const toggleWindowFromDock = useCallback((appId: string) => {
    const typedAppId = appId as 'terminal' | 'file-manager' | 'browser' | 'text-editor' | 'settings'
    const appWindows = allWindows.filter((w) => w.appId === typedAppId && w.workspaceId === activeWorkspace)

    if (appWindows.length === 0) {
      openWindow(typedAppId)
      return
    }

    const minimized = appWindows.filter((w) => w.isMinimized)
    if (minimized.length > 0) {
      restoreWindow(minimized[0].id);
    } else {
      openWindow(typedAppId)
    }
  }, [allWindows, activeWorkspace, openWindow, restoreWindow])

  const nightLight = useSettingsStore((s) => s.nightLight);
  const theme = useSettingsStore((s) => s.theme);
  const settingsWallpaper = useSettingsStore((s: any) => s.wallpaper);
  const activeWallpaper = settingsWallpaper || '/ubuntu_wallpaper.jpg';

  useEffect(() => {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  // Keyboard shortcuts for workspace management and app switching
  const switchDesktopShortcut = useSettingsStore((s) => s.switchDesktopShortcut);
  const switchAppShortcut = useSettingsStore((s) => s.switchAppShortcut);

  const cycleWindows = useCallback(() => {
    if (windowList.length === 0) return;
    const currentFocused = windowList.find(w => w.isFocused);
    const sorted = [...windowList].sort((a, b) => a.zIndex - b.zIndex);
    let nextWin = sorted[0];
    if (currentFocused) {
      const idx = sorted.findIndex(w => w.id === currentFocused.id);
      nextWin = sorted[(idx - 1 + sorted.length) % sorted.length];
    }
    if (nextWin) {
      useWindowStore.getState().restoreWindow(nextWin.id);
    }
  }, [windowList]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Super (Meta) key to toggle overview
      if (e.key === 'Meta' && !e.repeat) {
        // We'll toggle on keyup to avoid issues
        return;
      }

      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        openWindow('terminal');
        return;
      }
      
      let isNextDesktop = false;
      let isPrevDesktop = false;
      let isCycleApp = false;

      if (switchDesktopShortcut === 'ctrl+alt+arrow') {
        if (e.ctrlKey && e.altKey && e.key === 'ArrowRight') isNextDesktop = true;
        if (e.ctrlKey && e.altKey && e.key === 'ArrowLeft') isPrevDesktop = true;
      } else if (switchDesktopShortcut === 'super+arrow') {
        if (e.metaKey && e.key === 'ArrowRight') isNextDesktop = true;
        if (e.metaKey && e.key === 'ArrowLeft') isPrevDesktop = true;
      } else if (switchDesktopShortcut === 'alt+arrow') {
        if (e.altKey && e.key === 'ArrowRight') isNextDesktop = true;
        if (e.altKey && e.key === 'ArrowLeft') isPrevDesktop = true;
      }

      if (switchAppShortcut === 'alt+tab') {
        if (e.altKey && e.key === 'Tab') isCycleApp = true;
      } else if (switchAppShortcut === 'super+tab') {
        if (e.metaKey && e.key === 'Tab') isCycleApp = true;
      } else if (switchAppShortcut === 'ctrl+tab') {
        if (e.ctrlKey && e.key === 'Tab') isCycleApp = true;
      }

      if (isNextDesktop) {
        e.preventDefault();
        nextWorkspace();
      }
      if (isPrevDesktop) {
        e.preventDefault();
        prevWorkspace();
      }
      if (isCycleApp) {
        e.preventDefault();
        cycleWindows();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Toggle overview on Super key release
      if (e.key === 'Meta') {
        toggleOverview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [nextWorkspace, prevWorkspace, toggleOverview, switchDesktopShortcut, switchAppShortcut, cycleWindows]);

  if (!currentUser) return <UbuntuLogin />;

  return (
    <div className="shell" style={{ filter: nightLight ? 'sepia(0.35) hue-rotate(-15deg)' : 'none', transition: 'filter 0.5s ease-in-out' }}>
      <TopBar />
      <Desktop onUnfocusAll={unfocusAll} />

      {windowList.map((win) => (
        <Window
          key={win.id}
          id={win.id}
          icon={<img src={APP_META[win.appId]?.icon} alt="" style={{ width: 16, height: 16 }} />}
          headerControls={win.appId === 'terminal' ? <TerminalHeaderControls windowId={win.id} /> : undefined}
        >
          <MockAppContent appId={win.appId} windowId={win.id} />
        </Window>
      ))}

      <WorkspaceOverview wallpaper={activeWallpaper} onLaunchApp={toggleWindowFromDock} />

      <Dock />
      <SystemDialog />
    </div>
  );
}

function WindowsEnvironment() {
  const currentUser = useWindowsAuthStore((s) => s.currentUser);
  
  if (!currentUser) return <WindowsLogin />;
  
  return <WindowsDesktop />;
}

export default function App() {
  const { powerState, activeOS, turnOn, hardPowerOff } = useHardwareStore();

  useEffect(() => {
    // Disable browser back button
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (powerState === 'off') {
      // Simulate physical power button press on initial load
      const timer = setTimeout(() => turnOn(), 500);
      return () => clearTimeout(timer);
    }
    if (powerState === 'shutting_down') {
      const timer = setTimeout(() => hardPowerOff(), 3000);
      return () => clearTimeout(timer);
    }
  }, [powerState, turnOn, hardPowerOff]);

  useEffect(() => {
    if (powerState === 'off' || powerState === 'shutting_down' || powerState === 'post') {
      useWindowStore.getState().clearAllWindows();
      useWorkspaceStore.getState().resetWorkspaces();
      useUbuntuAuthStore.getState().logout();
      useWindowsAuthStore.getState().logout();
    }
  }, [powerState]);

  if (powerState === 'off') return <div style={{ width: '100vw', height: '100vh', background: 'black' }} />;
  if (powerState === 'post') return <POST />;
  if (powerState === 'bios') return <BIOS />;
  if (powerState === 'grub') return <Grub />;
  
  if (powerState === 'shutting_down') {
    return (
      <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <h2 style={{ color: 'white', fontFamily: 'sans-serif' }}>Shutting down...</h2>
          <div style={{ width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.2)', borderTop: '3px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (powerState === 'os') {
    if (activeOS === 'ubuntu') return <UbuntuEnvironment />;
    if (activeOS === 'windows') return <WindowsEnvironment />;
  }

  return null;
}
