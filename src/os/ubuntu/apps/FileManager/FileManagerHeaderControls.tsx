import React, { useCallback, useState } from 'react';
import { useWindowStore, useVFSStore } from '../../store';
import { useUbuntuAuthStore } from '../../store/useUbuntuAuthStore';
import { hasPermission } from '../../fs/permissions';
import { useSystemDialogStore } from '../../store/useSystemDialogStore';
import { getHomeId } from '../../fs/seed';

export function FileManagerHeaderControls({ windowId }: { windowId: string }) {
  const windowState = useWindowStore(useCallback((s) => s.windows.find((w) => w.id === windowId), [windowId]));
  const updateAppState = useWindowStore((s) => s.updateAppState);
  const vfsStore = useVFSStore();
  const username = useUbuntuAuthStore((s) => s.currentUser) || 'user';

  const appState = (windowState?.appState as any) || {};
  const cwdId = appState.cwdId || '';
  const viewMode = appState.viewMode || 'grid';
  const historyStack = appState.historyStack || [cwdId];
  const historyIndex = appState.historyIndex ?? 0;
  const isSearching = appState.isSearching || false;
  const searchQuery = appState.searchQuery || '';
  const elevatedDirs = appState.elevatedDirs || [];

  const [isEditingPath, setIsEditingPath] = useState(false);
  const [pathInput, setPathInput] = useState('');

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < historyStack.length - 1;

  const updateState = (updates: any) => {
    updateAppState(windowId, { ...appState, ...updates });
  };

  const navigateTo = (id: string, name: string = 'directory') => {
    if (id === cwdId) return;
    const canExecute = hasPermission(vfsStore.map, id, 'execute', username);
    if (!canExecute) {
      useSystemDialogStore.getState().openPolkitDialog({
        message: `Authentication is needed to access '${name}'.`,
        actionId: 'org.freedesktop.filemanager.access-directory',
        icon: 'folder',
        onSuccess: () => {
          const newStack = historyStack.slice(0, historyIndex + 1);
          newStack.push(id);
          const newElevated = elevatedDirs.includes(id) ? elevatedDirs : [...elevatedDirs, id];
          updateState({
            cwdId: id,
            historyStack: newStack,
            historyIndex: newStack.length - 1,
            elevatedDirs: newElevated,
            isSearching: false,
            searchQuery: '',
          });
        },
      });
      return;
    }
    const newStack = historyStack.slice(0, historyIndex + 1);
    newStack.push(id);
    updateState({
      cwdId: id,
      historyStack: newStack,
      historyIndex: newStack.length - 1,
      isSearching: false,
      searchQuery: '',
    });
  };

  const getSegments = (id: string) => {
    const segments = [];
    let current = vfsStore.getNode(id);
    while (current) {
      segments.unshift(current);
      if (current.parentId) {
        current = vfsStore.getNode(current.parentId);
      } else {
        current = null;
      }
    }
    return segments;
  };

  const segments = getSegments(cwdId);
  const homeId = getHomeId(username);
  const homeIndex = segments.findIndex(s => s.id === homeId);
  const displaySegments = homeIndex !== -1 ? segments.slice(homeIndex) : segments;
  const currentPathStr = '/' + segments.map(s => s.name).filter(Boolean).join('/');

  const handlePathSubmit = () => {
    const node = vfsStore.resolvePath(pathInput);
    if (node && node.type === 'directory') {
      navigateTo(node.id, node.name);
    }
    setIsEditingPath(false);
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'stretch', marginLeft: '-10px' }}>
      {/* Sidebar Header Area */}
      <div style={{ 
        width: 200, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 12px',
        borderRight: '1px solid var(--color-border)',
        flexShrink: 0 
      }}>
        <div 
          onClick={() => updateState({ isSearching: !isSearching })}
          style={{ 
            cursor: 'pointer', 
            opacity: isSearching ? 1 : 0.7,
            padding: '4px',
            borderRadius: '4px',
            background: isSearching ? 'var(--color-bg-hover)' : 'transparent',
            WebkitAppRegion: 'no-drag' 
          } as any}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Files</span>
        <div style={{ cursor: 'pointer', opacity: 0.7, WebkitAppRegion: 'no-drag' } as any}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
        </div>
      </div>

      {/* Main Content Header Area */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 8px',
        gap: '8px',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button 
            className="fm-nav-btn"
            disabled={!canGoBack}
            style={{ WebkitAppRegion: 'no-drag', background: 'transparent', padding: '6px' } as any}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              if (canGoBack) updateState({ cwdId: historyStack[historyIndex - 1], historyIndex: historyIndex - 1 });
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button 
            className="fm-nav-btn"
            disabled={!canGoForward}
            style={{ WebkitAppRegion: 'no-drag', background: 'transparent', padding: '6px' } as any}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              if (canGoForward) updateState({ cwdId: historyStack[historyIndex + 1], historyIndex: historyIndex + 1 });
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        {isSearching ? (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <input 
              autoFocus
              type="text" 
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => updateState({ searchQuery: e.target.value })}
              style={{
                background: 'rgba(0,0,0,0.05)',
                border: '1px solid transparent',
                color: 'var(--color-text-primary)',
                padding: '6px 12px',
                borderRadius: '6px',
                width: '100%',
                outline: 'none',
                WebkitAppRegion: 'no-drag'
              } as any}
              onPointerDown={(e) => e.stopPropagation()}
            />
          </div>
        ) : isEditingPath ? (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <input 
              autoFocus
              type="text" 
              value={pathInput}
              onChange={(e) => setPathInput(e.target.value)}
              onBlur={() => setIsEditingPath(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePathSubmit();
                if (e.key === 'Escape') setIsEditingPath(false);
              }}
              style={{
                background: 'rgba(0,0,0,0.05)',
                border: '1px solid var(--color-accent)',
                color: 'var(--color-text-primary)',
                padding: '6px 12px',
                borderRadius: '6px',
                width: '100%',
                outline: 'none',
                WebkitAppRegion: 'no-drag'
              } as any}
              onPointerDown={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <div 
            className="fm-breadcrumbs-pill" 
            onClick={() => {
              setPathInput(currentPathStr);
              setIsEditingPath(true);
            }}
            style={{ 
              flex: 1,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              background: 'rgba(0,0,0,0.05)', 
              borderRadius: '6px',
              padding: '4px 8px',
              cursor: 'text'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
              {segments.map((seg, idx) => (
                <React.Fragment key={seg.id}>
                  <button 
                    className="fm-breadcrumb-btn"
                    style={{ 
                      WebkitAppRegion: 'no-drag', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      padding: '2px 6px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-text-primary)',
                      cursor: 'pointer',
                      fontWeight: 500,
                      opacity: 0.85
                    } as any}
                    onPointerDown={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); navigateTo(seg.id); }}
                  >
                    {idx === 0 && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 12H2M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
                        <line x1="6" y1="16" x2="6.01" y2="16"></line>
                        <line x1="10" y1="16" x2="14" y2="16"></line>
                      </svg>
                    )}
                    {idx === 0 ? 'Ubuntu' : seg.name}
                  </button>
                  {idx < segments.length - 1 && <span style={{ opacity: 0.4, fontSize: '14px' }}>/</span>}
                </React.Fragment>
              ))}
            </div>
            
            {/* Right side of pill: 3 dots */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '4px', cursor: 'pointer', opacity: 0.6, WebkitAppRegion: 'no-drag' } as any} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="12" cy="5" r="1"></circle>
                <circle cx="12" cy="19" r="1"></circle>
              </svg>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', WebkitAppRegion: 'no-drag' } as any}>
          {/* Folder Search / Add Icon */}
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.7, padding: '4px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="3"></circle>
              <line x1="14.15" y1="15.15" x2="16" y2="17"></line>
            </svg>
          </button>
          
          {/* View Toggle */}
          <div className="fm-view-toggles" style={{ padding: 0, display: 'flex' }}>
            <button
              className={`fm-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => updateState({ viewMode: 'list' })}
              style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'transparent' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
