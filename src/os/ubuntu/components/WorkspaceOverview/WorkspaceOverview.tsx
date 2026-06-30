import { useCallback, useEffect, useRef, useState } from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useWindowStore } from '../../store/useUbuntuWindowStore';
import type { WindowState } from '../../types';

import terminalIcon from '../../assets/icons/terminal.svg';
import fileManagerIcon from '../../assets/icons/file-manager.svg';
import browserIcon from '../../assets/icons/browser.svg';
import textIcon from '../../assets/icons/text.svg';
import settingsIcon from '../../assets/icons/settings.svg';

import './WorkspaceOverview.css';

const APP_ICONS: Record<string, string> = {
  terminal: terminalIcon,
  'file-manager': fileManagerIcon,
  browser: browserIcon,
  'text-editor': textIcon,
  settings: settingsIcon,
};

interface WorkspaceOverviewProps {
  wallpaper: string;
  onLaunchApp: (appId: string) => void;
}

export function WorkspaceOverview({ wallpaper, onLaunchApp }: WorkspaceOverviewProps) {
  const isOpen = useWorkspaceStore((s) => s.isOverviewOpen);
  const isAppGridOpen = useWorkspaceStore((s) => s.isAppGridOpen);
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const workspaceCount = useWorkspaceStore((s) => s.workspaceCount);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);
  const closeOverview = useWorkspaceStore((s) => s.closeOverview);
  const addWorkspace = useWorkspaceStore((s) => s.addWorkspace);
  const removeWorkspace = useWorkspaceStore((s) => s.removeWorkspace);
  const reorderWorkspaces = useWorkspaceStore((s) => s.reorderWorkspaces);

  const allWindows = useWindowStore((s) => s.windows);
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const moveWindowToWorkspace = useWindowStore((s) => s.moveWindowToWorkspace);

  const containerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredApps = Object.entries(APP_ICONS).filter(([id, icon]) => {
    // Basic label matching (id parsing)
    const label = id === 'file-manager' ? 'Files' : id.replace('-', ' ');
    return label.toLowerCase().includes(searchQuery.toLowerCase());
  }).map(([id, icon]) => ({ id, icon, label: id === 'file-manager' ? 'Files' : id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }));

  // Close overview on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeOverview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOverview]);

  // Click on backdrop to close
  const handleBackdropClick = useCallback(() => {
    closeOverview();
  }, [closeOverview]);

  // Switch to workspace by clicking thumbnail
  const handleThumbnailClick = useCallback(
    (index: number) => {
      setActiveWorkspace(index);
    },
    [setActiveWorkspace]
  );

  // Click on a window preview to focus it and close overview
  const handleWindowPreviewClick = useCallback(
    (windowId: string) => {
      focusWindow(windowId);
      closeOverview();
    },
    [focusWindow, closeOverview]
  );

  // Close a window from the overview
  const handleWindowPreviewClose = useCallback(
    (e: React.MouseEvent, windowId: string) => {
      e.stopPropagation();
      closeWindow(windowId);
    },
    [closeWindow]
  );

  // Remove workspace (only if > 2)
  const handleRemoveWorkspace = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      removeWorkspace();
    },
    [removeWorkspace]
  );

  // Get windows for a specific workspace
  const getWorkspaceWindows = useCallback(
    (wsIndex: number) => allWindows.filter((w) => w.workspaceId === wsIndex),
    [allWindows]
  );

  // Get windows for the currently viewed workspace (active one)
  const activeWindows = getWorkspaceWindows(activeWorkspace);

  // Get screen size for scaling thumbnails
  const screenW = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const screenH = typeof window !== 'undefined' ? window.innerHeight : 1080;

  // Scale factor for mini-windows inside thumbnails
  const thumbW = 200;
  const thumbH = 125;
  const scaleX = thumbW / screenW;
  const scaleY = thumbH / screenH;

  return (
    <div
      ref={containerRef}
      className={`workspace-overview ${isOpen ? 'workspace-overview--open' : ''}`}
    >
      {/* Backdrop */}
      <div className="workspace-overview__backdrop" onClick={handleBackdropClick} />

      {/* Search Bar (Top) */}
      <div className="workspace-overview__search-container" onClick={(e) => e.stopPropagation()}>
        <input 
          type="text" 
          className="workspace-overview__search" 
          placeholder="Type to search" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus={isAppGridOpen}
        />
      </div>

      {/* Workspace thumbnails strip (Below Search) */}
      <div className="workspace-overview__strip">
        {Array.from({ length: workspaceCount }, (_, i) => {
          const wsWindows = getWorkspaceWindows(i);
          return (
            <div key={i} style={{ position: 'relative', paddingBottom: '24px' }}>
              <div
                className={`workspace-thumbnail ${
                  i === activeWorkspace ? 'workspace-thumbnail--active' : ''
                }`}
                onClick={() => handleThumbnailClick(i)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'workspace', index: i }));
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  try {
                    const dataStr = e.dataTransfer.getData('text/plain');
                    if (!dataStr) return;
                    const data = JSON.parse(dataStr);
                    
                    if (data.type === 'workspace') {
                      const oldIndex = data.index;
                      if (typeof oldIndex === 'number' && oldIndex !== i) {
                        reorderWorkspaces(oldIndex, i);
                      }
                    } else if (data.type === 'window') {
                      moveWindowToWorkspace(data.id, i);
                    }
                  } catch (err) {
                    // Ignore parsing errors for other dragged items
                  }
                }}
              >
                {/* Background wallpaper preview */}
                <div
                  className="workspace-thumbnail__bg"
                  style={{ backgroundImage: `url(${wallpaper})` }}
                />
                {/* Mini window previews */}
                <div className="workspace-thumbnail__windows">
                  {wsWindows
                    .filter((w) => !w.isMinimized)
                    .map((w) => (
                      <MiniWindow key={w.id} win={w} scaleX={scaleX} scaleY={scaleY} />
                    ))}
                </div>
                {/* Remove button for non-first workspaces */}
                {workspaceCount > 2 && (
                  <div
                    className="workspace-thumbnail__remove"
                    onClick={handleRemoveWorkspace}
                    title="Remove workspace"
                  >
                    <svg viewBox="0 0 10 10">
                      <line x1="2" y1="2" x2="8" y2="8" />
                      <line x1="8" y1="2" x2="2" y2="8" />
                    </svg>
                  </div>
                )}
              </div>
              <span className={`workspace-thumbnail__label`}>
                {i + 1}
              </span>
            </div>
          );
        })}
        {/* Add workspace button */}
        {workspaceCount < 8 && (
          <div style={{ position: 'relative', paddingBottom: '24px' }}>
            <div className="workspace-overview__add-btn" onClick={addWorkspace} title="Add workspace">
              <svg viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Main area: App Grid OR window previews for active workspace */}
      <div className="workspace-overview__main">
        {isAppGridOpen || searchQuery.length > 0 ? (
          <div className="workspace-overview__app-grid">
            {filteredApps.map(app => (
              <div key={app.id} className="workspace-overview__app-icon" onClick={() => { onLaunchApp(app.id); closeOverview(); setSearchQuery(''); }}>
                <img src={app.icon} alt={app.label} />
                <span>{app.label}</span>
              </div>
            ))}
          </div>
        ) : activeWindows.length === 0 ? (
          <div className="workspace-overview__empty">
            <div className="workspace-overview__empty-icon">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
              </svg>
            </div>
            <span className="workspace-overview__empty-text">No open windows</span>
          </div>
        ) : (
          activeWindows.map((win, idx) => (
            <WindowPreview
              key={win.id}
              win={win}
              index={idx}
              onClick={() => handleWindowPreviewClick(win.id)}
              onClose={(e) => handleWindowPreviewClose(e, win.id)}
            />
          ))
        )}
      </div>

      {/* Bottom dots */}
      <div className="workspace-overview__dots">
        {Array.from({ length: workspaceCount }, (_, i) => (
          <div
            key={i}
            className={`workspace-overview__dot ${
              i === activeWorkspace ? 'workspace-overview__dot--active' : ''
            }`}
            onClick={() => handleThumbnailClick(i)}
          />
        ))}
      </div>
    </div>
  );
}

/** Mini window rectangle inside a workspace thumbnail */
function MiniWindow({
  win,
  scaleX,
  scaleY,
}: {
  win: WindowState;
  scaleX: number;
  scaleY: number;
}) {
  const left = win.position.x * scaleX;
  const top = win.position.y * scaleY;
  const width = Math.max(win.size.width * scaleX, 12);
  const height = Math.max(win.size.height * scaleY, 8);

  return (
    <div
      className="workspace-thumbnail__mini-win"
      style={{ left, top, width, height }}
    >
      <div className="workspace-thumbnail__mini-win-titlebar" />
    </div>
  );
}

/** Larger window preview card in the main overview area */
function WindowPreview({
  win,
  index,
  onClick,
  onClose,
}: {
  win: WindowState;
  index: number;
  onClick: () => void;
  onClose: (e: React.MouseEvent) => void;
}) {
  const icon = APP_ICONS[win.appId];

  return (
    <div
      className="workspace-preview-window"
      onClick={onClick}
      style={{ animationDelay: `${index * 0.05}s` }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'window', id: win.id }));
        e.dataTransfer.effectAllowed = 'move';
      }}
    >
      {/* Close button */}
      <div className="workspace-preview-window__close" onClick={onClose}>
        <svg viewBox="0 0 10 10">
          <line x1="2" y1="2" x2="8" y2="8" />
          <line x1="8" y1="2" x2="2" y2="8" />
        </svg>
      </div>

      {/* Title bar */}
      <div className="workspace-preview-window__titlebar">
        {icon && (
          <img
            className="workspace-preview-window__titlebar-icon"
            src={icon}
            alt=""
          />
        )}
        <span className="workspace-preview-window__titlebar-title">
          {win.title}
        </span>
      </div>

      {/* Body placeholder */}
      <div className="workspace-preview-window__body">
        <div className="workspace-preview-window__body-placeholder">
          {icon && <img src={icon} alt="" />}
          <span>{win.title}</span>
        </div>
      </div>
    </div>
  );
}
