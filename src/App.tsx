import { useCallback, useEffect } from 'react'
import { useWindowStore } from './store'
import { TopBar } from './components/TopBar/TopBar'
import { Desktop } from './components/Desktop/Desktop'
import { Dock } from './components/Dock/Dock'
import { Window } from './components/Window/Window'
import terminalIcon from './assets/icons/terminal.svg'
import fileManagerIcon from './assets/icons/file-manager.svg'
import browserIcon from './assets/icons/browser.svg'
import { Terminal } from './apps/Terminal/Terminal'
import { FileManager } from './apps/FileManager/FileManager'
import { Browser } from './apps/Browser/Browser'
import './App.css'

/* ------------------------------------------------------------ *
 *  Types (Moved to store)                                       *
 * ------------------------------------------------------------ */

/* ------------------------------------------------------------ *
 *  App metadata                                                 *
 * ------------------------------------------------------------ */
const APP_META: Record<string, { title: string; icon: string; defaultSize: { width: number; height: number } }> = {
  terminal: {
    title: 'Terminal',
    icon: terminalIcon,
    defaultSize: { width: 680, height: 440 },
  },
  'file-manager': {
    title: 'Files',
    icon: fileManagerIcon,
    defaultSize: { width: 750, height: 500 },
  },
  browser: {
    title: 'Browser',
    icon: browserIcon,
    defaultSize: { width: 900, height: 600 },
  },
}

/* ------------------------------------------------------------ *
 *  Placeholder app content                                      *
 * ------------------------------------------------------------ */
function MockAppContent({ appId, windowId }: { appId: string, windowId: string }) {
  const styles: Record<string, React.CSSProperties> = {
    terminal: {
      background: '#1e1e2e',
      color: '#2ec27e',
      fontFamily: 'var(--font-mono)',
      fontSize: '13px',
      padding: '12px 16px',
      height: '100%',
    },
    'file-manager': {
      background: '#2d2d3f',
      color: 'var(--color-text-primary)',
      padding: '16px',
      height: '100%',
      display: 'flex',
      gap: '16px',
    },
    browser: {
      background: '#2d2d3f',
      color: 'var(--color-text-primary)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
    },
  }

  if (appId === 'terminal') {
    return <Terminal windowId={windowId} />;
  }

  if (appId === 'file-manager') {
    return <FileManager windowId={windowId} />;
  }

  if (appId === 'browser') {
    return <Browser windowId={windowId} />;
  }

  return null
}

/* ------------------------------------------------------------ *
 *  Main App                                                     *
 * ------------------------------------------------------------ */
function App() {
  const openWindow = useWindowStore((s) => s.openWindow);
  const unfocusAll = useWindowStore((s) => s.unfocusAll);
  const restoreWindow = useWindowStore((s) => s.restoreWindow);
  
  // Select windows directly to avoid mapping and creating new array references which causes infinite loops in modern Zustand
  const windowList = useWindowStore((s) => s.windows);

  /* --- Toggle minimize from dock --- */
  const toggleWindowFromDock = useCallback((appId: string) => {
    // Explicitly cast appId to the required type
    const typedAppId = appId as 'terminal' | 'file-manager' | 'browser'
    const appWindows = windowList.filter((w) => w.appId === typedAppId)

    if (appWindows.length === 0) {
      // No windows for this app — open new
      openWindow(typedAppId)
      return
    }

    const minimized = appWindows.filter((w) => w.isMinimized)
    if (minimized.length > 0) {
      // Restore the first minimized window
      const targetId = minimized[0].id;
      restoreWindow(targetId);
    } else {
      // All visible — focus the first one or open a new one?
      // Original said: "All visible — open a new one"
      openWindow(typedAppId)
    }
  }, [windowList, openWindow, restoreWindow])

  /* --- Compute which appIds have active (non-minimized) windows --- */
  const activeAppIds = new Set(
    windowList.filter((w) => !w.isMinimized).map((w) => w.appId)
  )

  return (
    <div className="shell">
      <TopBar />
      <Desktop onUnfocusAll={unfocusAll} />

      {/* Render all windows */}
      {windowList.map((win) => (
        <Window
          key={win.id}
          id={win.id}
          icon={
            <img
              src={APP_META[win.appId]?.icon}
              alt=""
              style={{ width: 16, height: 16 }}
            />
          }
        >
          <MockAppContent appId={win.appId} windowId={win.id} />
        </Window>
      ))}

      <Dock
        onAppClick={toggleWindowFromDock}
        activeAppIds={activeAppIds}
      />
    </div>
  )
}

export default App
