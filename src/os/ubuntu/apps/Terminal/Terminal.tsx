import { useEffect, useState, useCallback, useMemo } from 'react';
import { useWindowAPI } from '../../hooks/useWindowAPI';
import { useWindowStore } from '../../store';
import { TerminalTabBar } from './components/TerminalTabBar';
import { TerminalSession, type TerminalTabState } from './components/TerminalSession';
import { TerminalMenu } from './components/TerminalMenu';
import { TerminalSearch } from './components/TerminalSearch';
import { useTerminalProfileStore } from './store/useTerminalProfileStore';
import { themes } from './themes';
import './Terminal.css';

interface TerminalProps {
  windowId: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export function Terminal({ windowId }: TerminalProps) {
  const { updateState, getState } = useWindowAPI(windowId);
  const isFocused = useWindowStore((s) => s.windows.find(w => w.id === windowId)?.isFocused);
  
  // Read state once on mount to initialize local tabs state
  const initialAppState = useMemo(() => getState<any>() || {}, [getState]);
  
  // We manage tabs and activeTabId locally for performance, then sync to windowStore occasionally
  const [tabs, setTabs] = useState<TerminalTabState[]>(() => {
    if (initialAppState.tabs && initialAppState.tabs.length > 0) {
      return initialAppState.tabs;
    }
    // Migrate legacy state or create default
    return [{
      id: `tab-${generateId()}`,
      title: initialAppState.cwdPath === '/' ? '/' : (initialAppState.cwdPath?.split('/').pop() || '~'),
      cwdId: initialAppState.cwdId || 'root',
      cwdPath: initialAppState.cwdPath || '/',
      effectiveUser: initialAppState.effectiveUser || 'peasant',
      commandHistory: initialAppState.commandHistory || [],
      interactiveApp: initialAppState.interactiveApp,
      nanoFileId: initialAppState.nanoFileId,
      hasShownMotd: initialAppState.hasShownMotd || false,
    }];
  });
  
  const [activeTabId, setActiveTabId] = useState<string>(
    initialAppState.activeTabId || (tabs[0]?.id || '')
  );
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const profile = useTerminalProfileStore(state => state.activeProfile);
  const theme = themes[profile.colorScheme] || themes['ubuntu'];

  // Sync state to window manager periodically or on unmount
  useEffect(() => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    let windowTitle = 'Terminal';
    
    if (activeTab) {
      const hostname = localStorage.getItem('ubuntu-hostname') || 'envyy';
      let displayPath = activeTab.cwdPath;
      const homePrefix = `/home/${activeTab.effectiveUser}`;
      if (displayPath.startsWith(homePrefix)) {
        displayPath = '~' + displayPath.slice(homePrefix.length);
      }
      windowTitle = `${activeTab.effectiveUser}@${hostname}: ${displayPath}`;
    }

    updateState({ 
      tabs, 
      activeTabId,
      title: windowTitle,
      isLightTheme: profile.colorScheme === 'ubuntuLight'
    });
  }, [tabs, activeTabId, profile.colorScheme, updateState]);

  const handleTabStateChange = useCallback((tabId: string, updates: Partial<TerminalTabState>) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, ...updates } : t));
  }, []);

  const handleAddTab = useCallback(() => {
    const newTabId = `tab-${generateId()}`;
    const activeTab = tabs.find(t => t.id === activeTabId);
    
    const newTab: TerminalTabState = {
      id: newTabId,
      title: '~', // Will be updated on first prompt
      cwdId: activeTab ? activeTab.cwdId : 'root',
      cwdPath: activeTab ? activeTab.cwdPath : '/',
      effectiveUser: activeTab ? activeTab.effectiveUser : 'peasant',
      commandHistory: activeTab ? [...activeTab.commandHistory] : [],
      hasShownMotd: true, // Don't show MOTD on new tabs
    };
    
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTabId);
  }, [tabs, activeTabId]);

  const handleCloseTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      if (newTabs.length === 0) {
        useWindowStore.getState().closeWindow(windowId);
        return prev;
      }
      if (activeTabId === tabId) {
        // Find index of closed tab
        const idx = prev.findIndex(t => t.id === tabId);
        // Switch to the one before it, or after if it was the first
        const nextActive = newTabs[idx - 1] || newTabs[0];
        setActiveTabId(nextActive.id);
      }
      return newTabs;
    });
  }, [activeTabId, windowId]);

  useEffect(() => {
    const handleNewTab = (e: any) => {
      if (e.detail?.windowId === windowId) {
        handleAddTab();
      }
    };
    
    const handleToggleSearch = (e: any) => {
      if (e.detail?.windowId === windowId) {
        setIsSearchOpen(prev => !prev);
      }
    };
    
    const handleFullscreen = (e: any) => {
      if (e.detail?.windowId === windowId) {
        useWindowStore.getState().toggleMaximize(windowId);
      }
    };
    
    window.addEventListener('terminal:new-tab', handleNewTab);
    window.addEventListener('terminal:toggle-search', handleToggleSearch);
    window.addEventListener('terminal:fullscreen', handleFullscreen);
    
    return () => {
      window.removeEventListener('terminal:new-tab', handleNewTab);
      window.removeEventListener('terminal:toggle-search', handleToggleSearch);
      window.removeEventListener('terminal:fullscreen', handleFullscreen);
    };
  }, [windowId, handleAddTab]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'T') {
      e.preventDefault();
      handleAddTab();
    }
    else if (e.ctrlKey && e.shiftKey && e.key === 'W') {
      e.preventDefault();
      handleCloseTab(activeTabId);
    }
    else if (e.ctrlKey && e.key === 'PageUp') {
      e.preventDefault();
      const idx = tabs.findIndex(t => t.id === activeTabId);
      if (idx > 0) setActiveTabId(tabs[idx - 1].id);
      else setActiveTabId(tabs[tabs.length - 1].id); // loop
    }
    else if (e.ctrlKey && e.key === 'PageDown') {
      e.preventDefault();
      const idx = tabs.findIndex(t => t.id === activeTabId);
      if (idx < tabs.length - 1) setActiveTabId(tabs[idx + 1].id);
      else setActiveTabId(tabs[0].id); // loop
    }
    else if (e.altKey && !isNaN(Number(e.key))) {
      const num = Number(e.key);
      if (num >= 1 && num <= tabs.length) {
        e.preventDefault();
        setActiveTabId(tabs[num - 1].id);
      }
    }
  }, [tabs, activeTabId, handleAddTab, handleCloseTab]);

  return (
    <div 
      className="terminal-app" 
      style={{ 
        '--term-bg': theme.background,
        '--term-fg': theme.foreground,
        '--term-chrome': theme.chrome,
        '--term-chrome-fg': theme.chromeForeground,
        backgroundColor: theme.background, 
        display: 'flex', 
        flexDirection: 'column', 
        width: '100%', 
        height: '100%', 
        outline: 'none', 
        padding: 0 
      } as React.CSSProperties}
      onKeyDown={handleKeyDown}
      tabIndex={-1} // Allow div to receive keyboard events
    >
      
      {/* Tab Bar */}
      {tabs.length > 0 && (
        <TerminalTabBar 
          tabs={tabs} 
          activeTabId={activeTabId} 
          onTabSelect={setActiveTabId} 
          onTabClose={handleCloseTab} 
          onTabAdd={handleAddTab}
        />
      )}

      {/* Settings button is now in TerminalHeaderControls */}

      {/* Terminal Sessions */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
        {tabs.map(tab => (
          <TerminalSession 
            key={tab.id}
            windowId={windowId}
            tab={tab}
            isActive={tab.id === activeTabId}
            isFocused={isFocused || false}
            onStateChange={handleTabStateChange}
          />
        ))}
      </div>
      
      {/* Search Bar */}
      {isSearchOpen && (
        <TerminalSearch 
          windowId={windowId} 
          onClose={() => {
            setIsSearchOpen(false);
            window.dispatchEvent(new CustomEvent('terminal:close-search', { detail: { windowId } }));
          }} 
        />
      )}
    </div>
  );
}

export function TerminalHeaderControls({ windowId }: { windowId: string }) {
  const appState = useWindowStore(state => state.windows.find(w => w.id === windowId)?.appState as any);
  
  const activeTabId = appState?.activeTabId;
  const tabs = appState?.tabs || [];
  const activeTab = tabs.find((t: any) => t.id === activeTabId) || tabs[0];
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const user = activeTab?.effectiveUser || 'peasant';
  const homePath = user === 'root' ? '/root' : `/home/${user}`;
  const fullPath = activeTab?.cwdPath || homePath;
  const basename = fullPath === '/' ? '/' : (fullPath.split('/').pop() || '~');
  
  // Custom event trigger for new tab (this would ideally interact with Terminal component)
  // For now we'll just dispatch a dummy event, but full implementation would need context
  // The terminal adds a tab via a global event or store method if needed, but since we just want visual:
  
  return (
    <div className="terminal-header-csd">
      <div className="terminal-header-left">
        <button 
          className="terminal-header-btn" 
          title="New Tab" 
          onClick={() => {
            window.dispatchEvent(new CustomEvent('terminal:new-tab', { detail: { windowId } }));
          }}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </div>
      
      <div className="terminal-header-center">
        <div className="terminal-header-title">{user}@envyy: {basename}</div>
      </div>
      
      <div className="terminal-header-right">
        <button 
          className="terminal-header-btn" 
          title="Search" 
          onClick={() => window.dispatchEvent(new CustomEvent('terminal:toggle-search', { detail: { windowId } }))}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </button>
        <div style={{ position: 'relative' }}>
          <button 
            className="terminal-header-btn" 
            title="Terminal Menu" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            onDoubleClick={(e) => e.stopPropagation()}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          {isMenuOpen && <TerminalMenu windowId={windowId} onClose={() => setIsMenuOpen(false)} />}
        </div>
      </div>
    </div>
  );
}
