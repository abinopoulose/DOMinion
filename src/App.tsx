import { useState, useCallback } from 'react'
import { TopBar } from './components/TopBar/TopBar'
import { Desktop } from './components/Desktop/Desktop'
import { Dock } from './components/Dock/Dock'
import { Window } from './components/Window/Window'
import terminalIcon from './assets/icons/terminal.svg'
import fileManagerIcon from './assets/icons/file-manager.svg'
import browserIcon from './assets/icons/browser.svg'
import './App.css'

/* ------------------------------------------------------------ *
 *  Types                                                        *
 * ------------------------------------------------------------ */
interface WindowState {
  id: string
  appId: string
  title: string
  initialPosition: { x: number; y: number }
  initialSize: { width: number; height: number }
  zIndex: number
  isMinimized: boolean
  isFocused: boolean
}

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
function MockAppContent({ appId }: { appId: string }) {
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
    return (
      <div style={styles.terminal}>
        <div style={{ opacity: 0.6, marginBottom: 8 }}>Welcome to Ubuntu 24 Terminal</div>
        <div>
          <span style={{ color: '#2ec27e' }}>user@ubuntu</span>
          <span style={{ color: '#A0A0B0' }}>:</span>
          <span style={{ color: '#62a0ea' }}>~</span>
          <span style={{ color: '#A0A0B0' }}>$ </span>
          <span style={{ borderRight: '2px solid #2ec27e', animation: 'blink 1s step-end infinite', paddingRight: 2 }}>&nbsp;</span>
        </div>
      </div>
    )
  }

  if (appId === 'file-manager') {
    return (
      <div style={styles['file-manager']}>
        <div style={{
          width: 180,
          borderRight: '1px solid var(--color-border)',
          paddingRight: 16,
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Places
          </div>
          {['Home', 'Desktop', 'Documents', 'Downloads', 'Pictures'].map((place) => (
            <div
              key={place}
              style={{
                padding: '6px 8px',
                borderRadius: 6,
                fontSize: 13,
                cursor: 'pointer',
                marginBottom: 2,
              }}
            >
              {place}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
          <span style={{ fontSize: 14 }}>File Manager content here</span>
        </div>
      </div>
    )
  }

  if (appId === 'browser') {
    return (
      <div style={styles.browser}>
        <div style={{
          padding: '8px 12px',
          background: 'var(--color-bg-titlebar)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          {/* Nav buttons */}
          <button style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 16 }}>←</button>
          <button style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 16 }}>→</button>
          {/* URL bar */}
          <div style={{
            flex: 1,
            background: 'var(--color-bg-input)',
            borderRadius: 6,
            padding: '5px 12px',
            fontSize: 13,
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
          }}>
            https://
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
          <span style={{ fontSize: 14 }}>Browser content here</span>
        </div>
      </div>
    )
  }

  return null
}

/* ------------------------------------------------------------ *
 *  Main App                                                     *
 * ------------------------------------------------------------ */
let nextId = 1
let nextZIndex = 100
let cascadeOffset = 0

function App() {
  const [windows, setWindows] = useState<WindowState[]>([])

  /* --- Open a new window --- */
  const openWindow = useCallback((appId: string) => {
    const meta = APP_META[appId]
    if (!meta) return

    cascadeOffset = (cascadeOffset + 1) % 8
    const offset = cascadeOffset * 30

    const newWindow: WindowState = {
      id: `win-${nextId++}`,
      appId,
      title: meta.title,
      initialPosition: {
        x: 120 + offset,
        y: 60 + offset,
      },
      initialSize: meta.defaultSize,
      zIndex: nextZIndex++,
      isMinimized: false,
      isFocused: true,
    }

    setWindows((prev) => [
      ...prev.map((w) => ({ ...w, isFocused: false })),
      newWindow,
    ])
  }, [])

  /* --- Focus a window --- */
  const focusWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, isFocused: true, zIndex: nextZIndex++ }
          : { ...w, isFocused: false }
      )
    )
  }, [])

  /* --- Unfocus all --- */
  const unfocusAll = useCallback(() => {
    setWindows((prev) => prev.map((w) => ({ ...w, isFocused: false })))
  }, [])

  /* --- Close a window --- */
  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id))
  }, [])

  /* --- Minimize a window --- */
  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, isMinimized: true, isFocused: false } : w
      )
    )
  }, [])

  /* --- Toggle minimize from dock --- */
  const toggleWindowFromDock = useCallback((appId: string) => {
    const appWindows = windows.filter((w) => w.appId === appId)

    if (appWindows.length === 0) {
      // No windows for this app — open new
      openWindow(appId)
      return
    }

    const minimized = appWindows.filter((w) => w.isMinimized)
    if (minimized.length > 0) {
      // Restore the first minimized window
      const targetId = minimized[0].id
      setWindows((prev) =>
        prev.map((w) =>
          w.id === targetId
            ? { ...w, isMinimized: false, isFocused: true, zIndex: nextZIndex++ }
            : { ...w, isFocused: false }
        )
      )
    } else {
      // All visible — open a new one
      openWindow(appId)
    }
  }, [windows, openWindow])

  /* --- Compute which appIds have active (non-minimized) windows --- */
  const activeAppIds = new Set(
    windows.filter((w) => !w.isMinimized).map((w) => w.appId)
  )

  return (
    <div className="shell">
      <TopBar />
      <Desktop onUnfocusAll={unfocusAll} />

      {/* Render all windows */}
      {windows.map((win) => (
        <Window
          key={win.id}
          id={win.id}
          title={win.title}
          icon={
            <img
              src={APP_META[win.appId]?.icon}
              alt=""
              style={{ width: 16, height: 16 }}
            />
          }
          initialPosition={win.initialPosition}
          initialSize={win.initialSize}
          zIndex={win.zIndex}
          isMinimized={win.isMinimized}
          isFocused={win.isFocused}
          onFocus={() => focusWindow(win.id)}
          onClose={() => closeWindow(win.id)}
          onMinimize={() => minimizeWindow(win.id)}
        >
          <MockAppContent appId={win.appId} />
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
