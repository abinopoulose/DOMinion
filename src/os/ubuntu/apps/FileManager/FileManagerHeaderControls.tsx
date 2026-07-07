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
  const sortBy = appState.sortBy || 'name';
  const sortOrder = appState.sortOrder || 'asc';

  const [isEditingPath, setIsEditingPath] = useState(false);
  const [pathInput, setPathInput] = useState('');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < historyStack.length - 1;

  const updateState = (updates: any) => {
    updateAppState(windowId, { ...appState, ...updates });
  };

  const navigateTo = (id: string, name: string = 'directory') => {
    if (id === cwdId) return; // already there
    
    const canExecute = (id === 'starred' || id === 'other-locations') ? true : hasPermission(vfsStore.map, id, 'execute', username);
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
    if (id === 'starred') {
      return [{ id: 'starred', name: 'Starred', type: 'directory' as any, parentId: null, children: [], content: '', createdAt: 0, modifiedAt: 0, owner: '', group: '', permissions: '' }];
    }
    if (id === 'other-locations') {
      return [{ id: 'other-locations', name: '+ Other Locations', type: 'directory' as any, parentId: null, children: [], content: '', createdAt: 0, modifiedAt: 0, owner: '', group: '', permissions: '' }];
    }
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
        <div style={{ width: 16 }} /> {/* spacer */}
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
              onDoubleClick={(e) => e.stopPropagation()}
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
              onDoubleClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <div 
            className="fm-breadcrumbs-pill" 
            onDoubleClick={(e) => {
              e.stopPropagation();
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
                    {seg.id === 'starred' ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        Starred
                      </>
                    ) : seg.id === 'other-locations' ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Other Locations
                      </>
                    ) : (
                      <>
                        {idx === 0 && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 12H2M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
                            <line x1="6" y1="16" x2="6.01" y2="16"></line>
                            <line x1="10" y1="16" x2="14" y2="16"></line>
                          </svg>
                        )}
                        {idx === 0 ? 'Ubuntu' : seg.name}
                      </>
                    )}
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

          
          {/* View Toggle */}
          <div className="fm-view-toggles" style={{ padding: 0, display: 'flex', position: 'relative', border: 'none' }}>
            <button
              className={`fm-view-btn ${showSortMenu ? 'active' : ''}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setShowSortMenu(!showSortMenu)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: showSortMenu ? 'var(--color-bg-active)' : 'transparent', width: 'auto', padding: '0 8px' }}
            >
              {viewMode === 'list' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              )}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {showSortMenu && (
              <>
                {/* Backdrop to close menu */}
                <div 
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                  onPointerDown={(e) => { e.stopPropagation(); setShowSortMenu(false); }}
                />
                
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: '100%', 
                    right: 0, 
                    marginTop: '8px', 
                    background: 'var(--color-bg-window)', 
                    border: '1px solid var(--color-border)', 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    padding: '8px',
                    zIndex: 1000,
                    width: '160px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>View</div>
                  <button 
                    className={`fm-menu-item ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => { updateState({ viewMode: 'list' }); setShowSortMenu(false); }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6"></line>
                      <line x1="8" y1="12" x2="21" y2="12"></line>
                      <line x1="8" y1="18" x2="21" y2="18"></line>
                      <line x1="3" y1="6" x2="3.01" y2="6"></line>
                      <line x1="3" y1="12" x2="3.01" y2="12"></line>
                      <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                    List
                  </button>
                  <button 
                    className={`fm-menu-item ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => { updateState({ viewMode: 'grid' }); setShowSortMenu(false); }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7"></rect>
                      <rect x="14" y="3" width="7" height="7"></rect>
                      <rect x="14" y="14" width="7" height="7"></rect>
                      <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                    Grid
                  </button>
                  <div style={{ height: '1px', background: 'var(--color-border)', margin: '4px 0' }} />
                  <div style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sort By</div>
                  <button 
                    className={`fm-menu-item ${sortBy === 'name' ? 'active' : ''}`}
                    onClick={() => {
                      if (sortBy === 'name') {
                        updateState({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
                      } else {
                        updateState({ sortBy: 'name', sortOrder: 'asc' });
                      }
                      setShowSortMenu(false);
                    }}
                  >
                    <span style={{ flex: 1 }}>Name</span>
                    {sortBy === 'name' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {sortOrder === 'asc' ? <polyline points="18 15 12 9 6 15"></polyline> : <polyline points="6 9 12 15 18 9"></polyline>}
                      </svg>
                    )}
                  </button>
                  <button 
                    className={`fm-menu-item ${sortBy === 'size' ? 'active' : ''}`}
                    onClick={() => {
                      if (sortBy === 'size') {
                        updateState({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
                      } else {
                        updateState({ sortBy: 'size', sortOrder: 'asc' });
                      }
                      setShowSortMenu(false);
                    }}
                  >
                    <span style={{ flex: 1 }}>Size</span>
                    {sortBy === 'size' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {sortOrder === 'asc' ? <polyline points="18 15 12 9 6 15"></polyline> : <polyline points="6 9 12 15 18 9"></polyline>}
                      </svg>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
