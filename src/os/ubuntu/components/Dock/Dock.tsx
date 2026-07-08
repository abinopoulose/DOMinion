import { DockIcon } from './DockIcon';
import terminalIcon from '../../assets/icons/terminal.svg';
import fileManagerIcon from '../../assets/icons/file-manager.svg';
import browserIcon from '../../assets/icons/browser.svg';
import settingsIcon from '../../assets/icons/settings.svg';
import textIcon from '../../assets/icons/text.svg';
import trashIcon from '../../assets/icons/trash.svg';
import { getTrashId } from '../../fs/seed';
import { useUbuntuAuthStore } from '../../store/useUbuntuAuthStore';
import { useWindowStore } from '../../store/useUbuntuWindowStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useSettingsStore } from '../../apps/Settings/store/useSettingsStore';
import { useContextMenu } from '../../hooks/useContextMenu';
import { ContextMenu } from '../ContextMenu/ContextMenu';
import { useMemo, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useDockScroll } from '../../hooks/useDockScroll';
import './Dock.css';

function WindowSnapshot({ windowId }: { windowId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    const el = document.querySelector(`[data-window-id="${windowId}"] .window__content`);
    
    if (!el) {
      // Window is likely minimized and not in the DOM
      const win = useWindowStore.getState().windows.find(w => w.id === windowId);
      const meta = win ? APP_META[win.appId] : null;
      if (meta) {
        containerRef.current.innerHTML = `<img src="${meta.icon}" style="width:48px;height:48px;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.5;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3));" />`;
      }
      return;
    }
    
    const clone = el.cloneNode(true) as HTMLElement;
    
    // Copy canvas data (like terminal)
    const originalCanvases = el.querySelectorAll('canvas');
    const clonedCanvases = clone.querySelectorAll('canvas');
    originalCanvases.forEach((canvas, index) => {
      const cloneCanvas = clonedCanvases[index];
      if (cloneCanvas) {
        const ctx = cloneCanvas.getContext('2d');
        if (ctx) ctx.drawImage(canvas, 0, 0);
      }
    });
    
    // Scale the content down to fit 180x120 preview box
    const originalRect = el.getBoundingClientRect();
    const scaleX = 180 / (originalRect.width || 800);
    const scaleY = 120 / (originalRect.height || 600);
    const scale = Math.min(scaleX, scaleY);
    
    clone.style.position = 'absolute';
    clone.style.top = '50%';
    clone.style.left = '50%';
    clone.style.transform = `translate(-50%, -50%) scale(${scale})`;
    clone.style.transformOrigin = 'center center';
    clone.style.width = `${originalRect.width}px`;
    clone.style.height = `${originalRect.height}px`;
    clone.style.pointerEvents = 'none';
    clone.style.margin = '0';
    clone.style.padding = '0';
    clone.style.boxSizing = 'border-box';
    
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(clone);
  }, [windowId]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }} />;
}

const APP_META: Record<string, { label: string; icon: string }> = {
  'file-manager': { label: 'Files', icon: fileManagerIcon },
  'terminal': { label: 'Terminal', icon: terminalIcon },
  'browser': { label: 'Browser', icon: browserIcon },
  'settings': { label: 'Settings', icon: settingsIcon },
  'text-editor': { label: 'Text Editor', icon: textIcon },
};

export function Dock() {
  const dockScrollRef = useDockScroll();
  const openWindow = useWindowStore(s => s.openWindow);
  const windows = useWindowStore(s => s.windows) || [];
  const activeWorkspace = useWorkspaceStore(s => s.activeWorkspace);
  
  // Only show indicators for windows on the current workspace
  const currentWorkspaceWindows = windows.filter(w => w.workspaceId === activeWorkspace);
  const focusedAppId = currentWorkspaceWindows.find(w => w.isFocused)?.appId;
  const { dockPosition, dockIconSize, dockAutoHide, pinnedApps, setPinnedApps } = useSettingsStore();

  const activeAppIds = new Set(windows.map((w: any) => w.appId));

  const dockAppIds = useMemo(() => {
    const ids = [...pinnedApps];
    // add unpinned but open apps
    const allOpenAppIds = new Set(windows.map((w: any) => w.appId));
    for (const appId of allOpenAppIds) {
      if (!ids.includes(appId)) ids.push(appId);
    }
    return ids;
  }, [pinnedApps, windows]);

  const { menu, show: showMenu, hide: hideMenu } = useContextMenu();
  const [contextAppId, setContextAppId] = useState<string | null>(null);
  const [previewAppId, setPreviewAppId] = useState<string | null>(null);
  const [previewPos, setPreviewPos] = useState({ top: -9999, left: -9999 });
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [isOverlapped, setIsOverlapped] = useState(false);

  useEffect(() => {
    if (!dockAutoHide) {
      setIsOverlapped(false);
      return;
    }

    const checkOverlap = () => {
      const dockWidth = dockPosition === 'left' || dockPosition === 'right' ? dockIconSize + 12 : window.innerWidth;
      const dockHeight = dockPosition === 'bottom' ? dockIconSize + 12 : window.innerHeight - 28; // 28 is topbar height
      
      let dockRect;
      if (dockPosition === 'left') {
        dockRect = { left: 0, top: 28, right: dockWidth, bottom: window.innerHeight };
      } else if (dockPosition === 'right') {
        dockRect = { left: window.innerWidth - dockWidth, top: 28, right: window.innerWidth, bottom: window.innerHeight };
      } else { // bottom
        dockRect = { left: 0, top: window.innerHeight - dockHeight, right: window.innerWidth, bottom: window.innerHeight };
      }

      let overlap = false;
      for (const win of currentWorkspaceWindows) {
        if (win.isMinimized) continue;
        
        let winLeft = win.position.x;
        let winTop = win.position.y;
        let winRight = winLeft + win.size.width;
        let winBottom = winTop + win.size.height;
        
        if (win.isMaximized) {
           winLeft = 0;
           winTop = 28;
           winRight = window.innerWidth;
           winBottom = window.innerHeight;
        }

        if (
          winLeft < dockRect.right &&
          winRight > dockRect.left &&
          winTop < dockRect.bottom &&
          winBottom > dockRect.top
        ) {
          overlap = true;
          break;
        }
      }
      setIsOverlapped(overlap);
    };

    checkOverlap();
    window.addEventListener('resize', checkOverlap);
    return () => window.removeEventListener('resize', checkOverlap);
  }, [dockAutoHide, dockPosition, dockIconSize, currentWorkspaceWindows]);

  const handleMouseEnterIcon = (_e: React.MouseEvent, appId: string) => {
    const appWindows = currentWorkspaceWindows.filter(w => w.appId === appId);
    if (appWindows.length > 0) {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      setPreviewAppId(appId);
    }
  };

  // Calculate preview position after render to prevent overflow and align perfectly with icon
  useLayoutEffect(() => {
    if (previewAppId && previewRef.current) {
      const popupRect = previewRef.current.getBoundingClientRect();
      const iconEl = document.getElementById(`dock-icon-wrapper-${previewAppId}`);
      if (!iconEl) return;
      
      const iconRect = iconEl.getBoundingClientRect();
      
      let newTop = 0;
      let newLeft = 0;
      
      if (dockPosition === 'bottom') {
        newTop = iconRect.top - popupRect.height - 12;
        newLeft = iconRect.left + (iconRect.width / 2) - (popupRect.width / 2);
      } else if (dockPosition === 'right') {
        newTop = iconRect.top + (iconRect.height / 2) - (popupRect.height / 2);
        newLeft = iconRect.left - popupRect.width - 12;
      } else { // left
        newTop = iconRect.top + (iconRect.height / 2) - (popupRect.height / 2);
        newLeft = iconRect.right + 12;
      }
      
      // Clamp to screen bounds
      if (newTop < 36) newTop = 36; // below topbar
      if (newTop + popupRect.height > window.innerHeight) newTop = window.innerHeight - popupRect.height - 12;
      if (newLeft < 12) newLeft = 12;
      if (newLeft + popupRect.width > window.innerWidth) newLeft = window.innerWidth - popupRect.width - 12;
      
      setPreviewPos(prev => {
        if (Math.abs(prev.top - newTop) > 1 || Math.abs(prev.left - newLeft) > 1) {
          return { top: newTop, left: newLeft };
        }
        return prev;
      });
    } else {
      // Hide offscreen when not active
      setPreviewPos(prev => {
        if (prev.top !== -9999) return { top: -9999, left: -9999 };
        return prev;
      });
    }
  }, [previewAppId, dockPosition, currentWorkspaceWindows.length]);

  const handleMouseLeaveIcon = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setPreviewAppId(null);
    }, 250);
  };

  const handleAppClick = (appId: string) => {
    const appWindows = currentWorkspaceWindows.filter(w => w.appId === appId);
    
    if (appWindows.length === 0) {
      // Check if it's on another workspace, for now just open new window in current workspace
      // like default GNOME does if you click icon of app not on current workspace
      openWindow(appId as any);
      return;
    }

    if (appWindows.length === 1) {
      const win = appWindows[0];
      if (win.isMinimized) {
        useWindowStore.getState().restoreWindow(win.id);
        useWindowStore.getState().focusWindow(win.id);
      } else if (win.isFocused) {
        useWindowStore.getState().minimizeWindow(win.id);
      } else {
        useWindowStore.getState().focusWindow(win.id);
      }
      setPreviewAppId(null);
      return;
    }

    // Multiple windows - since hover shows preview, click could focus the most recently used
    const focusedWin = appWindows.find(w => w.isFocused);
    if (focusedWin) {
      useWindowStore.getState().minimizeWindow(focusedWin.id);
    } else {
      const sorted = [...appWindows].sort((a, b) => b.zIndex - a.zIndex);
      const topWin = sorted[0];
      if (topWin.isMinimized) {
        useWindowStore.getState().restoreWindow(topWin.id);
      } else {
        useWindowStore.getState().focusWindow(topWin.id);
      }
    }
  };

  const handleAuxClick = (e: React.MouseEvent, appId: string) => {
    if (e.button === 1) {
      openWindow(appId as any);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, appId: string) => {
    e.preventDefault();
    setContextAppId(appId);
    showMenu(e);
  };

  const contextMenuItems = contextAppId ? [
    {
      id: 'pin',
      label: pinnedApps.includes(contextAppId) ? 'Unpin from Dock' : 'Pin to Dock',
      onClick: () => {
        if (pinnedApps.includes(contextAppId)) {
          setPinnedApps(pinnedApps.filter(id => id !== contextAppId));
        } else {
          setPinnedApps([...pinnedApps, contextAppId]);
        }
        hideMenu();
      }
    }
  ] : [];

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    e.dataTransfer.setData('application/x-dock-app', appId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetAppId: string) => {
    const droppedAppId = e.dataTransfer.getData('application/x-dock-app');
    if (droppedAppId && droppedAppId !== targetAppId) {
      e.preventDefault();
      let newPinned = [...pinnedApps];
      if (!newPinned.includes(droppedAppId)) newPinned.push(droppedAppId);
      if (!newPinned.includes(targetAppId)) newPinned.push(targetAppId);
      
      const draggedIdx = newPinned.indexOf(droppedAppId);
      const targetIdx = newPinned.indexOf(targetAppId);
      if (draggedIdx > -1 && targetIdx > -1) {
        newPinned.splice(draggedIdx, 1);
        newPinned.splice(targetIdx, 0, droppedAppId);
        setPinnedApps(newPinned);
      }
    }
  };

  return (
    <nav 
      ref={dockScrollRef as any}
      className={`dock ${dockPosition} ${dockAutoHide ? 'auto-hide' : ''} ${isOverlapped ? 'overlapped' : ''}`}
      id="dock"
      style={{
        width: dockPosition === 'left' || dockPosition === 'right' ? `${dockIconSize + 12}px` : 'auto',
        height: dockPosition === 'bottom' ? `${dockIconSize + 12}px` : '100%',
        flexDirection: dockPosition === 'bottom' ? 'row' : 'column',
        justifyContent: 'flex-start',
        padding: dockPosition === 'bottom' ? '0 16px' : '8px 0',
      }}
    >
      <div className="dock__apps" style={{ display: 'flex', flexDirection: dockPosition === 'bottom' ? 'row' : 'column', gap: '8px', alignItems: 'center' }}>
        {dockAppIds.map((appId) => {
          const meta = APP_META[appId];
          if (!meta) return null;
          return (
            <div 
              key={appId} 
              style={{ position: 'relative' }}
              onMouseEnter={(e) => handleMouseEnterIcon(e, appId)}
              onMouseLeave={handleMouseLeaveIcon}
              id={`dock-icon-wrapper-${appId}`}
            >
              <DockIcon
                id={appId}
                label={meta.label}
                icon={meta.icon}
                isActive={activeAppIds.has(appId)}
                isFocused={focusedAppId === appId}
                size={dockIconSize}
                onClick={() => handleAppClick(appId)}
                onAuxClick={(e) => handleAuxClick(e, appId)}
                onContextMenu={(e) => handleContextMenu(e, appId)}
                draggable
                onDragStart={(e) => handleDragStart(e, appId)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, appId)}
              />
              {previewAppId === appId && (
                <div 
                  className="dock-previews"
                  ref={previewRef}
                  style={{ top: previewPos.top, left: previewPos.left }}
                  onMouseEnter={() => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current); }}
                  onMouseLeave={handleMouseLeaveIcon}
                >
                  {currentWorkspaceWindows.filter(w => w.appId === appId).map(win => (
                    <div 
                      key={win.id} 
                      className="dock-preview-item" 
                      onMouseEnter={() => {
                        useWindowStore.getState().setPreviewFocusWindowId(win.id);
                      }}
                      onMouseLeave={() => {
                        useWindowStore.getState().setPreviewFocusWindowId(null);
                      }}
                      onClick={() => {
                        useWindowStore.getState().setPreviewFocusWindowId(null);
                        useWindowStore.getState().restoreWindow(win.id);
                        useWindowStore.getState().focusWindow(win.id);
                        setPreviewAppId(null);
                      }}
                    >
                      <div className="dock-preview-thumbnail">
                        <div className="dock-preview-titlebar">
                          <span>{win.title}</span>
                          <button 
                            className="dock-preview-close"
                            title="Close Window"
                            onClick={(e) => {
                              e.stopPropagation();
                              useWindowStore.getState().setPreviewFocusWindowId(null);
                              useWindowStore.getState().closeWindow(win.id);
                              if (currentWorkspaceWindows.filter(w => w.appId === appId).length <= 1) {
                                setPreviewAppId(null);
                              }
                            }}
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                          </button>
                        </div>
                        <div className="dock-preview-body">
                          <WindowSnapshot windowId={win.id} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {/* Trash Icon at the bottom of docked apps */}
        <div style={{ 
          width: dockPosition === 'bottom' ? '1px' : '32px', 
          height: dockPosition === 'bottom' ? '32px' : '1px', 
          background: 'rgba(255,255,255,0.12)', 
          margin: dockPosition === 'bottom' ? '0 4px' : '4px 0',
          flexShrink: 0
        }} />
        <DockIcon
          id="trash"
          label="Trash"
          icon={trashIcon}
          isActive={windows.some(w => w.appId === 'file-manager' && (w.appState as any)?.cwdId === getTrashId(useUbuntuAuthStore.getState().currentUser || 'peasant'))}
          isFocused={focusedAppId === 'file-manager' && (windows.find(w => w.isFocused)?.appState as any)?.cwdId === getTrashId(useUbuntuAuthStore.getState().currentUser || 'peasant')}
          size={dockIconSize}
          onClick={() => {
            const trashId = getTrashId(useUbuntuAuthStore.getState().currentUser || 'peasant');
            const trashWindows = windows.filter(w => w.appId === 'file-manager' && (w.appState as any)?.cwdId === trashId);
            if (trashWindows.length > 0) {
              const win = trashWindows[0];
              if (win.isMinimized) {
                useWindowStore.getState().restoreWindow(win.id);
                useWindowStore.getState().focusWindow(win.id);
              } else if (win.isFocused) {
                useWindowStore.getState().minimizeWindow(win.id);
              } else {
                useWindowStore.getState().focusWindow(win.id);
              }
            } else {
              openWindow('file-manager', { cwdId: trashId });
            }
          }}
        />
      </div>
      <div 
        className="dock__show-apps" 
        style={{ 
          width: `${dockIconSize}px`, 
          height: `${dockIconSize}px`, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          cursor: 'pointer', 
          borderRadius: '8px', 
          transition: 'background 0.15s', 
          marginTop: dockPosition === 'bottom' ? '0' : 'auto', 
          marginBottom: dockPosition === 'bottom' ? '0' : '24px', 
          marginLeft: dockPosition === 'bottom' ? 'auto' : '0' 
        }} 
        onClick={() => useWorkspaceStore.getState().toggleAppGrid()} 
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-dock-hover)'} 
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <svg viewBox="0 0 24 24" fill="white" width={dockIconSize * 0.5} height={dockIconSize * 0.5} style={{ opacity: 0.9 }}>
          <circle cx="5" cy="5" r="2.5"/>
          <circle cx="12" cy="5" r="2.5"/>
          <circle cx="19" cy="5" r="2.5"/>
          <circle cx="5" cy="12" r="2.5"/>
          <circle cx="12" cy="12" r="2.5"/>
          <circle cx="19" cy="12" r="2.5"/>
          <circle cx="5" cy="19" r="2.5"/>
          <circle cx="12" cy="19" r="2.5"/>
          <circle cx="19" cy="19" r="2.5"/>
        </svg>
      </div>

      {menu.isVisible && (
        <ContextMenu x={menu.x} y={menu.y} items={contextMenuItems} />
      )}
    </nav>
  );
}
