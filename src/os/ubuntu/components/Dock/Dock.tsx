import { DockIcon } from './DockIcon';
import terminalIcon from '../../assets/icons/terminal.svg';
import fileManagerIcon from '../../assets/icons/file-manager.svg';
import browserIcon from '../../assets/icons/browser.svg';
import settingsIcon from '../../assets/icons/settings.svg';
import textIcon from '../../assets/icons/text.svg';
import { useWindowStore } from '../../store/useUbuntuWindowStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useSettingsStore } from '../../apps/Settings/store/useSettingsStore';
import { useContextMenu } from '../../hooks/useContextMenu';
import { ContextMenu } from '../ContextMenu/ContextMenu';
import { useMemo, useState } from 'react';
import './Dock.css';

const APP_META: Record<string, { label: string; icon: string }> = {
  'file-manager': { label: 'Files', icon: fileManagerIcon },
  'terminal': { label: 'Terminal', icon: terminalIcon },
  'browser': { label: 'Browser', icon: browserIcon },
  'settings': { label: 'Settings', icon: settingsIcon },
  'text-editor': { label: 'Text Editor', icon: textIcon },
};

export function Dock() {
  const openWindow = useWindowStore(s => s.openWindow);
  const windows = useWindowStore(s => s.windows) || [];
  const activeWorkspace = useWorkspaceStore(s => s.activeWorkspace);
  
  // Only show indicators for windows on the current workspace
  const currentWorkspaceWindows = windows.filter(w => w.workspaceId === activeWorkspace);
  const focusedAppId = currentWorkspaceWindows.find(w => w.isFocused)?.appId;
  const { dockPosition, dockIconSize, dockAutoHide, pinnedApps, setPinnedApps } = useSettingsStore();

  const activeAppIds = new Set(currentWorkspaceWindows.filter((w: any) => !w.isMinimized).map((w: any) => w.appId));

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

  const handleAppClick = (appId: string) => {
    if (activeAppIds.has(appId)) {
      const window = currentWorkspaceWindows.find(w => w.appId === appId);
      if (window) {
        if (window.isFocused) {
          useWindowStore.getState().minimizeWindow(window.id);
        } else {
          useWindowStore.getState().restoreWindow(window.id);
        }
      }
    } else {
      openWindow(appId as any);
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
      className={`dock ${dockPosition} ${dockAutoHide ? 'auto-hide' : ''}`}
      id="dock"
      style={{
        width: dockPosition === 'left' || dockPosition === 'right' ? `${dockIconSize + 24}px` : 'auto',
        height: dockPosition === 'bottom' ? `${dockIconSize + 24}px` : '100%',
        flexDirection: dockPosition === 'bottom' ? 'row' : 'column',
        justifyContent: dockPosition === 'bottom' ? 'center' : 'flex-start',
      }}
    >
      <div className="dock__apps" style={{ display: 'flex', flexDirection: dockPosition === 'bottom' ? 'row' : 'column', gap: '8px', alignItems: 'center' }}>
        {dockAppIds.map((appId) => {
          const meta = APP_META[appId];
          if (!meta) return null;
          return (
            <DockIcon
              key={appId}
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
          );
        })}
      </div>
      <div className="dock__show-apps" style={{ width: `${dockIconSize}px`, height: `${dockIconSize}px`, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.15s', marginTop: dockPosition === 'bottom' ? '0' : 'auto', marginBottom: dockPosition === 'bottom' ? '0' : '24px', marginLeft: dockPosition === 'bottom' ? '16px' : '0' }} onClick={() => useWorkspaceStore.getState().toggleAppGrid()} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-dock-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
        <svg viewBox="-2 -2 28 28" fill="#d3d3d3" width={dockIconSize * 0.7} height={dockIconSize * 0.7} style={{ opacity: 0.9, overflow: 'visible' }}>
          <path d="M17.61.455a3.41 3.41 0 0 0-3.41 3.41 3.41 3.41 0 0 0 3.41 3.41 3.41 3.41 0 0 0 3.41-3.41 3.41 3.41 0 0 0-3.41-3.41zM12.92.8C8.923.777 5.137 2.941 3.148 6.451a4.5 4.5 0 0 1 .26-.007 4.92 4.92 0 0 1 2.585.737A8.316 8.316 0 0 1 12.688 3.6 4.944 4.944 0 0 1 13.723.834 11.008 11.008 0 0 0 12.92.8zm9.226 4.994a4.915 4.915 0 0 1-1.918 2.246 8.36 8.36 0 0 1-.273 8.303 4.89 4.89 0 0 1 1.632 2.54 11.156 11.156 0 0 0 .559-13.089zM3.41 7.932A3.41 3.41 0 0 0 0 11.342a3.41 3.41 0 0 0 3.41 3.409 3.41 3.41 0 0 0 3.41-3.41 3.41 3.41 0 0 0-3.41-3.41zm2.027 7.866a4.908 4.908 0 0 1-2.915.358 11.1 11.1 0 0 0 7.991 6.698 11.234 11.234 0 0 0 2.422.249 4.879 4.879 0 0 1-.999-2.85 8.484 8.484 0 0 1-.836-.136 8.304 8.304 0 0 1-5.663-4.32zm11.405.928a3.41 3.41 0 0 0-3.41 3.41 3.41 3.41 0 0 0 3.41 3.41 3.41 3.41 0 0 0 3.41-3.41 3.41 3.41 0 0 0-3.41-3.41z"/>
        </svg>
      </div>

      {menu.isVisible && (
        <ContextMenu x={menu.x} y={menu.y} items={contextMenuItems} />
      )}
    </nav>
  );
}
