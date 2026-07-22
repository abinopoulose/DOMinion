import { useCallback, useEffect, Suspense, useState } from 'react'
import { useHardwareStore } from './hardware/store/useHardwareStore'
import { useUbuntuAuthStore } from './os/ubuntu/store/useUbuntuAuthStore'
import { useSettingsStore } from './os/ubuntu/apps/Settings/store/useSettingsStore'

// Static load OS components
import { UbuntuLogin } from './os/ubuntu/components/Login/UbuntuLogin'

// Ubuntu UI
import { useWindowStore } from './os/ubuntu/store/useUbuntuWindowStore'
import { useShallow } from 'zustand/react/shallow'
import { useWorkspaceStore } from './os/ubuntu/store/useWorkspaceStore'
import { TopBar } from './os/ubuntu/components/TopBar/TopBar'
import { Desktop } from './os/ubuntu/components/Desktop/Desktop'
import { Dock } from './os/ubuntu/components/Dock/Dock'
import { WorkspaceOSD } from './os/ubuntu/components/WorkspaceOSD/WorkspaceOSD'
import { WorkspaceOverview } from './os/ubuntu/components/WorkspaceOverview/WorkspaceOverview'
import { Window } from './os/ubuntu/components/Window/Window'
const terminalIcon = '/ubuntu/icons/terminal-app.png';
const fileManagerIcon = '/ubuntu/icons/folder.png';
const browserIcon = '/ubuntu/icons/browser.svg';
const textIcon = '/ubuntu/icons/text-x-generic.png';
const settingsIcon = '/ubuntu/icons/system-settings.png';
const calculatorIcon = '/ubuntu/icons/calculator-app.png';
const clockIcon = '/ubuntu/icons/clock-app.png';
import React from 'react';

// Lazy load Apps
const Terminal = React.lazy(() => import('./os/ubuntu/apps/Terminal/Terminal').then(m => ({ default: m.Terminal })));
const TerminalHeaderControls = React.lazy(() => import('./os/ubuntu/apps/Terminal/Terminal').then(m => ({ default: m.TerminalHeaderControls })));
const TerminalPreferences = React.lazy(() => import('./os/ubuntu/apps/Terminal/components/TerminalPreferences').then(m => ({ default: m.TerminalPreferences })));
const FileManager = React.lazy(() => import('./os/ubuntu/apps/FileManager/FileManager').then(m => ({ default: m.FileManager })));
const FileManagerHeaderControls = React.lazy(() => import('./os/ubuntu/apps/FileManager/FileManager').then(m => ({ default: m.FileManagerHeaderControls })));
const Browser = React.lazy(() => import('./os/ubuntu/apps/Browser/Browser').then(m => ({ default: m.Browser })));
const BrowserHeaderControls = React.lazy(() => import('./os/ubuntu/apps/Browser/Browser').then(m => ({ default: m.BrowserHeaderControls })));
const TextEditor = React.lazy(() => import('./os/ubuntu/apps/TextEditor/TextEditor').then(m => ({ default: m.TextEditor })));
const TextEditorHeaderControls = React.lazy(() => import('./os/ubuntu/apps/TextEditor/components/TextEditorHeaderControls').then(m => ({ default: m.TextEditorHeaderControls })));
const Settings = React.lazy(() => import('./os/ubuntu/apps/Settings/Settings').then(m => ({ default: m.Settings })));
const SettingsHeaderControls = React.lazy(() => import('./os/ubuntu/apps/Settings/Settings').then(m => ({ default: m.SettingsHeaderControls })));
const Calculator = React.lazy(() => import('./os/ubuntu/apps/Calculator/Calculator').then(m => ({ default: m.Calculator })));
const ClockApp = React.lazy(() => import('./os/ubuntu/apps/Clock/ClockApp').then(m => ({ default: m.ClockApp })));
const ClockHeaderControls = React.lazy(() => import('./os/ubuntu/apps/Clock/ClockApp').then(m => ({ default: m.ClockHeaderControls })));
const ImageViewer = React.lazy(() => import('./os/ubuntu/apps/ImageViewer/ImageViewer').then(m => ({ default: m.ImageViewer })));
const VideoPlayer = React.lazy(() => import('./os/ubuntu/apps/VideoPlayer/VideoPlayer').then(m => ({ default: m.VideoPlayer })));
const DocumentViewer = React.lazy(() => import('./os/ubuntu/apps/DocumentViewer/DocumentViewer').then(m => ({ default: m.DocumentViewer })));
const DiskUsageAnalyzer = React.lazy(() => import('./os/ubuntu/apps/DiskUsageAnalyzer/DiskUsageAnalyzer').then(m => ({ default: m.DiskUsageAnalyzer })));
const WelcomeApp = React.lazy(() => import('./os/ubuntu/apps/Welcome/WelcomeApp').then(m => ({ default: m.WelcomeApp })));
const ErrorReporter = React.lazy(() => import('./os/ubuntu/apps/ErrorReporter/ErrorReporter').then(m => ({ default: m.ErrorReporter })));
const SystemMonitor = React.lazy(() => import('./os/ubuntu/apps/SystemMonitor/SystemMonitor').then(m => ({ default: m.SystemMonitor })));
import { useClockDaemon } from './os/ubuntu/apps/Clock/hooks/useClockDaemon'
import { SystemDialog } from './os/ubuntu/components/SystemDialog/SystemDialog'
import { NotificationPopup } from './os/ubuntu/components/Notifications/NotificationPopup'
import './App.css'

const APP_META: Record<string, { title: string; icon: string; defaultSize: { width: number; height: number } }> = {
  terminal: { title: 'Terminal', icon: terminalIcon, defaultSize: { width: 680, height: 440 } },
  'file-manager': { title: 'Files', icon: fileManagerIcon, defaultSize: { width: 750, height: 500 } },
  browser: { title: 'Firefox', icon: browserIcon, defaultSize: { width: 900, height: 600 } },
  'text-editor': { title: 'Text Editor', icon: textIcon, defaultSize: { width: 600, height: 500 } },
  'terminal-preferences': { title: 'Terminal Preferences', icon: settingsIcon, defaultSize: { width: 550, height: 450 } },
  calculator: { title: 'Calculator', icon: calculatorIcon, defaultSize: { width: 320, height: 480 } },
  settings: { title: 'Settings', icon: settingsIcon, defaultSize: { width: 900, height: 600 } },
  clock: { title: 'Clocks', icon: clockIcon, defaultSize: { width: 800, height: 600 } },
  'image-viewer': { title: 'Image Viewer', icon: '/ubuntu/icons/image-viewer.png', defaultSize: { width: 800, height: 600 } },
  'video-player': { title: 'Video Player', icon: '/ubuntu/icons/video-x-generic.png', defaultSize: { width: 800, height: 600 } },
  'document-viewer': { title: 'Document Viewer', icon: '/ubuntu/icons/document-viewer.png', defaultSize: { width: 800, height: 900 } },
  'disk-usage-analyzer': { title: 'Disk Usage Analyzer', icon: '/ubuntu/icons/disk.png', defaultSize: { width: 500, height: 400 } },
  'welcome': { title: 'Welcome to Ubuntu', icon: '/ubuntu/icons/ubuntu-logo.svg', defaultSize: { width: 700, height: 500 } },
  'error-reporter': { title: 'System Error', icon: '/ubuntu/icons/system-settings.png', defaultSize: { width: 550, height: 450 } },
  'system-monitor': { title: 'System Monitor', icon: '/ubuntu/icons/utilities-system-monitor.png', defaultSize: { width: 650, height: 500 } },
}

export function UbuntuLoadingScreen({ shuttingDown = false }: { shuttingDown?: boolean }) {
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 99999 }}>
      <svg viewBox="0 0 24 24" width="100" height="100" fill="var(--color-accent, #E95420)">
        <path d="M17.61.455a3.41 3.41 0 0 0-3.41 3.41 3.41 3.41 0 0 0 3.41 3.41 3.41 3.41 0 0 0 3.41-3.41 3.41 3.41 0 0 0-3.41-3.41zM12.92.8C8.923.777 5.137 2.941 3.148 6.451a4.5 4.5 0 0 1 .26-.007 4.92 4.92 0 0 1 2.585.737A8.316 8.316 0 0 1 12.688 3.6 4.944 4.944 0 0 1 13.723.834 11.008 11.008 0 0 0 12.92.8zm9.226 4.994a4.915 4.915 0 0 1-1.918 2.246 8.36 8.36 0 0 1-.273 8.303 4.89 4.89 0 0 1 1.632 2.54 11.156 11.156 0 0 0 .559-13.089zM3.41 7.932A3.41 3.41 0 0 0 0 11.342a3.41 3.41 0 0 0 3.41 3.409 3.41 3.41 0 0 0 3.41-3.41 3.41 3.41 0 0 0-3.41-3.41zm2.027 7.866a4.908 4.908 0 0 1-2.915.358 11.1 11.1 0 0 0 7.991 6.698 11.234 11.234 0 0 0 2.422.249 4.879 4.879 0 0 1-.999-2.85 8.484 8.484 0 0 1-.836-.136 8.304 8.304 0 0 1-5.663-4.32zm11.405.928a3.41 3.41 0 0 0-3.41 3.41 3.41 3.41 0 0 0 3.41 3.41 3.41 3.41 0 0 0 3.41-3.41 3.41 3.41 0 0 0-3.41-3.41z"/>
      </svg>
      <div style={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid transparent', borderTop: '3px solid #fff', borderRight: '3px solid #fff', borderRadius: '50%', animation: 'plymouth-spin 1s linear infinite' }}></div>
        <h1 style={{ color: 'white', fontFamily: 'Ubuntu, sans-serif', fontSize: '32px', fontWeight: 'bold', margin: 0, letterSpacing: '-1px' }}>ubuntu</h1>
        {shuttingDown && <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontFamily: 'sans-serif' }}>Shutting down...</div>}
      </div>
      <style>{`@keyframes plymouth-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function MockAppContent({ appId, windowId }: { appId: string, windowId: string }) {
  if (appId === 'terminal') return <Terminal windowId={windowId} />;
  if (appId === 'file-manager') return <FileManager windowId={windowId} />;
  if (appId === 'browser') return <Browser windowId={windowId} />;
  if (appId === 'terminal-preferences') return <TerminalPreferences onClose={() => useWindowStore.getState().closeWindow(windowId)} />;
  if (appId === 'text-editor') return <TextEditor windowId={windowId} />;
  if (appId === 'calculator') return <Calculator windowId={windowId} />;
  if (appId === 'settings') return <Settings />;
  if (appId === 'clock') return <ClockApp windowId={windowId} />;
  if (appId === 'image-viewer') return <ImageViewer windowId={windowId} />;
  if (appId === 'video-player') return <VideoPlayer windowId={windowId} />;
  if (appId === 'document-viewer') return <DocumentViewer windowId={windowId} />;
  if (appId === 'disk-usage-analyzer') return <DiskUsageAnalyzer windowId={windowId} />;
  if (appId === 'welcome') return <WelcomeApp windowId={windowId} />;
  if (appId === 'error-reporter') return <ErrorReporter windowId={windowId} />;
  if (appId === 'system-monitor') return <SystemMonitor windowId={windowId} />;
  return null;
}

function UbuntuEnvironment() {
  useClockDaemon();

  const [vfsReady, setVfsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const start = Date.now();
    
    // Start both imports in parallel to avoid serial dynamic-import overhead
    const seedP = import('./os/ubuntu/fs/vfsDb');
    const migrateP = import('./os/ubuntu/fs/migration');
    Promise.all([seedP, migrateP]).then(async ([{ seedVfsFromSnapshot }, { migrateVFS }]) => {
      await seedVfsFromSnapshot();  // Only blocks on ~38 base nodes now (instant)
      await migrateVFS();           // Usually a no-op (no legacy keys)
      
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 800 - elapsed);
      
      setTimeout(() => {
        if (mounted) setVfsReady(true);
      }, remaining);
    });
    
    return () => { mounted = false; };
  }, []);

  const currentUser = useUbuntuAuthStore((s) => s.currentUser);
  const openWindow = useWindowStore((s) => s.openWindow);
  const unfocusAll = useWindowStore((s) => s.unfocusAll);
  const restoreWindow = useWindowStore((s) => s.restoreWindow);
  
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const allWindows = useWindowStore(useShallow((s) => s.windows));
  const workspaceCount = useWorkspaceStore((s) => s.workspaceCount);
  const nextWorkspace = useWorkspaceStore((s) => s.nextWorkspace);
  const prevWorkspace = useWorkspaceStore((s) => s.prevWorkspace);
  const toggleOverview = useWorkspaceStore((s) => s.toggleOverview);

  const windowList = allWindows.filter(w => w.workspaceId === activeWorkspace);

  const toggleWindowFromDock = useCallback((appId: string) => {
    const typedAppId = appId as 'terminal' | 'file-manager' | 'browser' | 'text-editor' | 'calculator' | 'settings' | 'clock'
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
  }, [allWindows, openWindow, restoreWindow])

  const nightLight = useSettingsStore((s) => s.nightLight);
  const screenBrightness = useSettingsStore((s) => s.screenBrightness ?? 100);
  const theme = useSettingsStore((s) => s.theme);
  const accentColor = useSettingsStore((s) => s.accentColor);
  const settingsWallpaper = useSettingsStore((s: any) => s.wallpaper);
  const activeWallpaper = settingsWallpaper || '/ubuntu/wallpapers/ubuntu_wallpaper.jpg';

  useEffect(() => {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);
    document.documentElement.style.setProperty('--color-accent', accentColor);
  }, [theme, accentColor]);

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

  if (!vfsReady) return (
    <UbuntuLoadingScreen />
  );

  if (!currentUser) return (
    <Suspense fallback={<div style={{ width: '100vw', height: '100vh', background: '#2E222A' }} />}>
      <UbuntuLogin />
    </Suspense>
  );

  const filterString = `brightness(${screenBrightness / 100}) ${nightLight ? 'sepia(0.35) hue-rotate(-15deg)' : ''}`.trim();

  return (
    <div className="shell" style={{ filter: filterString, transition: 'filter 0.1s ease-out' }}>
      <TopBar />
      <div 
        className="workspaces-slider-track"
        style={{
          display: 'flex',
          width: `${workspaceCount * 100}vw`,
          height: '100vh',
          transform: `translateX(-${activeWorkspace * 100}vw)`,
          transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0
        }}
      >
        {Array.from({ length: workspaceCount }).map((_, i) => (
          <div 
            key={i} 
            className="workspace-slide"
            style={{
              width: '100vw',
              height: '100vh',
              position: 'relative',
              backgroundImage: `url(${activeWallpaper})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {i === 0 && <Desktop onUnfocusAll={unfocusAll} />}
            {allWindows.filter((win) => win.workspaceId === i).map((win) => (
              <Window
                key={win.id}
                id={win.id}
                icon={<img src={APP_META[win.appId]?.icon} alt="" style={{ width: 16, height: 16 }} />}
                headerControls={
                  win.appId === 'terminal' ? <Suspense fallback={null}><TerminalHeaderControls windowId={win.id} /></Suspense> :
                  win.appId === 'browser' ? <Suspense fallback={null}><BrowserHeaderControls windowId={win.id} /></Suspense> : 
                  win.appId === 'settings' ? <Suspense fallback={null}><SettingsHeaderControls windowId={win.id} /></Suspense> :
                  win.appId === 'file-manager' ? <Suspense fallback={null}><FileManagerHeaderControls windowId={win.id} /></Suspense> :
                  win.appId === 'text-editor' ? <Suspense fallback={null}><TextEditorHeaderControls windowId={win.id} /></Suspense> :
                  win.appId === 'clock' ? <Suspense fallback={null}><ClockHeaderControls windowId={win.id} /></Suspense> : undefined
                }
                fullHeaderControls={win.appId === 'terminal' || win.appId === 'browser' || win.appId === 'settings' || win.appId === 'file-manager' || win.appId === 'clock' || win.appId === 'text-editor'}
              >
                <Suspense fallback={<div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 30, height: 30, border: '3px solid #f3f3f3', borderTop: '3px solid var(--color-accent, #E95420)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>}>
                  <MockAppContent appId={win.appId} windowId={win.id} />
                </Suspense>
              </Window>
            ))}
          </div>
        ))}
      </div>

      <WorkspaceOverview wallpaper={activeWallpaper} onLaunchApp={toggleWindowFromDock} />

      <Dock />
      <WorkspaceOSD />
      <NotificationPopup />
      <SystemDialog />
    </div>
  );
}


export default function App() {
  const pathname = window.location.pathname;
  if (pathname.startsWith('/app/')) {
    const appId = pathname.split('/')[2];
    const params = new URLSearchParams(window.location.search);
    const windowId = params.get('windowId') || 'standalone';
    return (
      <Suspense fallback={<div style={{ width: '100vw', height: '100vh', background: '#2E222A' }} />}>
        <MockAppContent appId={appId} windowId={windowId} />
      </Suspense>
    );
  }

  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const { powerState, activeOS, turnOn, hardPowerOff, isSuspended, wake } = useHardwareStore();

  useEffect(() => {
    if (activeOS !== 'ubuntu') {
      document.body.style.background = '#000';
    } else {
      document.body.style.background = '';
    }
  }, [activeOS]);

  useEffect(() => {
    if (!isSuspended) return;
    
    const handleWake = () => {
      wake();
    };

    const timer = setTimeout(() => {
      window.addEventListener('keydown', handleWake);
      window.addEventListener('click', handleWake);
      window.addEventListener('mousemove', handleWake);
    }, 2000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleWake);
      window.removeEventListener('click', handleWake);
      window.removeEventListener('mousemove', handleWake);
    };
  }, [isSuspended, wake]);



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
    if (powerState === 'shutting_down') {
      const timer = setTimeout(() => hardPowerOff(), 3000);
      return () => clearTimeout(timer);
    }
  }, [powerState, hardPowerOff]);

  useEffect(() => {
    if (powerState !== 'os') {
      useWindowStore.getState().clearAllWindows();
      useWorkspaceStore.getState().resetWorkspaces();
      useUbuntuAuthStore.getState().logout();
    }
  }, [powerState]);

  useEffect(() => {
    // IPC Router for Iframes
    const handleIPC = (e: MessageEvent) => {
      if (!e.data || !e.data.type || !e.data.windowId) return;
      const { type, windowId, payload } = e.data;
      const store = useWindowStore.getState();

      switch (type) {
        case 'WINDOW_API_SET_TITLE':
          store.updateWindowTitle(windowId, payload.title);
          break;
        case 'WINDOW_API_RESIZE_TO':
          store.updateSize(windowId, { width: payload.width, height: payload.height });
          break;
        case 'WINDOW_API_REQUEST_ATTENTION':
          store.focusWindow(windowId);
          break;
        case 'WINDOW_API_UPDATE_STATE':
          store.updateAppState(windowId, payload.newState);
          break;
        case 'OS_API_CLOSE_WINDOW':
          store.closeWindow(windowId);
          break;
      }
    };
    window.addEventListener('message', handleIPC);
    return () => window.removeEventListener('message', handleIPC);
  }, []);

  if (isMobile) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#fff', padding: '24px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" style={{ marginBottom: '24px' }}>
          <path d="M4 6h16v12H4z" opacity=".3"/>
          <path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v12H4V6z"/>
        </svg>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Desktop Only</h1>
        <p style={{ fontSize: '16px', lineHeight: '1.5', color: '#ccc' }}>
          This website is designed exclusively for large screens.<br/><br/>
          Please visit this site from a laptop or desktop computer to continue.
        </p>
      </div>
    );
  }

  if (powerState === 'off') {
    return (
      <div 
        style={{ 
          width: '100vw', 
          height: '100vh', 
          background: 'black',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          color: '#444',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}
        onClick={() => {
          try {
            if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {});
            }
          } catch (err) {}
          turnOn();
        }}
      >
        &gt; Click to Power On
      </div>
    );
  }

  
  if (powerState === 'shutting_down') {
    if (activeOS === 'ubuntu') {
      return <UbuntuLoadingScreen shuttingDown={true} />;
    }
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
    return (
      <>
        {activeOS === 'ubuntu' ? (
          <UbuntuEnvironment />
        ) : null}
        {isSuspended && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'black', zIndex: 999999, cursor: 'none' }} />
        )}
      </>
    );
  }

  return null;
}
