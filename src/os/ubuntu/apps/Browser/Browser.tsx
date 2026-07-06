import { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWindowStore } from '../../store';
import { BrowserTab } from './BrowserTab';
import { BrowserContent } from './BrowserContent';
import './Browser.css';

interface BrowserProps {
  windowId: string;
}

interface TabState {
  id: string;
  url: string;
  title: string;
  history: string[];
  historyIndex: number;
}

interface BrowserAppState {
  tabs: TabState[];
  activeTabId: string;
}
export const defaultBrowserAppState: BrowserAppState = {
  tabs: [{ id: 'default', url: '', title: 'New Tab', history: [''], historyIndex: 0 }],
  activeTabId: 'default',
};

export function BrowserHeaderControls({ windowId }: BrowserProps) {
  const windowState = useWindowStore(useCallback((s) => s.windows.find((w) => w.id === windowId), [windowId]));
  const updateAppState = useWindowStore((s) => s.updateAppState);
  const appState = (windowState?.appState as BrowserAppState) || defaultBrowserAppState;
  
  if (!appState.activeTabId && appState.tabs.length > 0) {
    appState.activeTabId = appState.tabs[0].id;
  }
  
  const { tabs, activeTabId } = appState;

  const updateState = (updates: Partial<BrowserAppState>) => {
    updateAppState(windowId, { ...appState, ...updates });
  };

  const handleNewTab = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent window dragging
    const newTabId = uuidv4();
    const newTabs = [...tabs, { id: newTabId, url: '', title: 'New Tab', history: [''], historyIndex: 0 }];
    updateState({ tabs: newTabs, activeTabId: newTabId });
  };

  const handleCloseTab = (tabId: string) => {
    const newTabs = tabs.filter(t => t.id !== tabId);
    if (newTabs.length === 0) {
      useWindowStore.getState().closeWindow(windowId);
    } else if (activeTabId === tabId) {
      updateState({ tabs: newTabs, activeTabId: newTabs[newTabs.length - 1].id });
    } else {
      updateState({ tabs: newTabs });
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, tabId: string) => {
    const tabToMove = tabs.find(t => t.id === tabId);
    if (!tabToMove) return;
    (window as any)._browserTabConsumed = false;
    e.dataTransfer.setData('application/x-browser-tab', JSON.stringify({ 
      sourceWindowId: windowId, 
      tab: tabToMove 
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>, tabId: string) => {
    if (!(window as any)._browserTabConsumed) {
      if (tabs.length <= 1) return;
      
      const tabToMove = tabs.find(t => t.id === tabId);
      if (!tabToMove) return;

      handleCloseTab(tabId);
      
      useWindowStore.getState().openWindow('browser', {
        tabs: [tabToMove],
        activeTabId: tabId
      }, { position: { x: Math.max(0, e.clientX - 60), y: Math.max(28, e.clientY - 20) } });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    (window as any)._browserTabConsumed = true; // Mark as consumed
    
    const dataStr = e.dataTransfer.getData('application/x-browser-tab');
    if (!dataStr) return;
    
    try {
      const data = JSON.parse(dataStr);
      if (data.sourceWindowId === windowId) return; // same window drag not handled yet
      
      const allWindows = useWindowStore.getState().windows;
      const sourceWindow = allWindows.find(w => w.id === data.sourceWindowId);
      
      if (sourceWindow) {
        const sourceAppState = sourceWindow.appState as BrowserAppState;
        const newSourceTabs = sourceAppState.tabs.filter((t: TabState) => t.id !== data.tab.id);
        
        if (newSourceTabs.length === 0) {
           useWindowStore.getState().closeWindow(sourceWindow.id);
        } else {
           const newActive = sourceAppState.activeTabId === data.tab.id ? newSourceTabs[newSourceTabs.length - 1].id : sourceAppState.activeTabId;
           useWindowStore.getState().updateAppState(sourceWindow.id, { tabs: newSourceTabs, activeTabId: newActive });
        }
      }
      
      updateState({
        tabs: [...tabs, data.tab],
        activeTabId: data.tab.id
      });
    } catch (err) {}
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes('application/x-browser-tab')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  return (
    <div 
      className="browser-tab-bar" 
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {tabs.map((tab) => (
        <div key={tab.id} onPointerDown={(e) => e.stopPropagation()}>
          <BrowserTab
            id={tab.id}
            title={tab.title}
            isActive={tab.id === activeTabId}
            onClick={(id) => updateState({ activeTabId: id })}
            onClose={handleCloseTab}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        </div>
      ))}
      <button 
        className="browser-new-tab-btn" 
        onClick={handleNewTab}
        onPointerDown={(e) => e.stopPropagation()}
      >
        +
      </button>
    </div>
  );
}

export function Browser({ windowId }: BrowserProps) {
  const windowState = useWindowStore(useCallback((s) => s.windows.find((w) => w.id === windowId), [windowId]));
  const updateAppState = useWindowStore((s) => s.updateAppState);
  const updateWindowTitle = useWindowStore((s) => s.updateWindowTitle);

  const [urlInputValue, setUrlInputValue] = useState('');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const defaultAppState = defaultBrowserAppState;

  const appState = (windowState?.appState as BrowserAppState) || defaultAppState;

  // Ensure there's an active tab
  if (!appState.activeTabId && appState.tabs.length > 0) {
    appState.activeTabId = appState.tabs[0].id;
  }

  const { tabs, activeTabId } = appState;
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    setUrlInputValue(activeTab.url);
    updateWindowTitle(windowId, activeTab.title ? `${activeTab.title} — Browser` : 'Browser');
  }, [activeTabId, activeTab.url, activeTab.title, windowId, updateWindowTitle]);

  const updateState = (updates: Partial<BrowserAppState>) => {
    updateAppState(windowId, { ...appState, ...updates });
  };

  const updateTab = (tabId: string, updates: Partial<TabState>) => {
    const newTabs = tabs.map(t => t.id === tabId ? { ...t, ...updates } : t);
    updateState({ tabs: newTabs });
  };

  const handleNewTab = () => {
    const newTabId = uuidv4();
    const newTabs = [...tabs, { id: newTabId, url: '', title: 'New Tab', history: [''], historyIndex: 0 }];
    updateState({ tabs: newTabs, activeTabId: newTabId });
  };

  const handleCloseTab = (tabId: string) => {
    const newTabs = tabs.filter(t => t.id !== tabId);
    if (newTabs.length === 0) {
      // Create a fresh tab if last one closed
      const newTabId = uuidv4();
      updateState({ tabs: [{ id: newTabId, url: '', title: 'New Tab', history: [''], historyIndex: 0 }], activeTabId: newTabId });
    } else if (activeTabId === tabId) {
      // Make the last tab active
      updateState({ tabs: newTabs, activeTabId: newTabs[newTabs.length - 1].id });
    } else {
      updateState({ tabs: newTabs });
    }
  };

  const navigateTo = (url: string) => {
    let finalUrl = url;
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = 'https://' + url;
    }
    
    const newHistory = activeTab.history.slice(0, activeTab.historyIndex + 1);
    newHistory.push(finalUrl);
    updateTab(activeTab.id, { 
      url: finalUrl, 
      history: newHistory, 
      historyIndex: newHistory.length - 1 
    });
    setUrlInputValue(finalUrl);
  };

  const handleBack = () => {
    if (activeTab.historyIndex > 0) {
      const newIndex = activeTab.historyIndex - 1;
      const newUrl = activeTab.history[newIndex];
      updateTab(activeTab.id, { url: newUrl, historyIndex: newIndex });
    }
  };

  const handleForward = () => {
    if (activeTab.historyIndex < activeTab.history.length - 1) {
      const newIndex = activeTab.historyIndex + 1;
      const newUrl = activeTab.history[newIndex];
      updateTab(activeTab.id, { url: newUrl, historyIndex: newIndex });
    }
  };

  const handleRefresh = () => {
    // A bit hacky: append a hash or just trigger a re-render. Since we use controlled iframes, 
    // it's tricky to refresh without a key. We can briefly blank the URL or add a dummy param.
    // For simplicity, we just navigate to the same URL which might not reload if react optimizes it,
    // so we force it by temporarily emptying the URL.
    const currentUrl = activeTab.url;
    if (currentUrl) {
      updateTab(activeTab.id, { url: '' });
      setTimeout(() => updateTab(activeTab.id, { url: currentUrl }), 10);
    }
  };

  return (
    <div className="browser">
      <div className="browser-toolbar">
        <button className="browser-nav-btn" onClick={handleBack} disabled={activeTab.historyIndex <= 0}>←</button>
        <button className="browser-nav-btn" onClick={handleForward} disabled={activeTab.historyIndex >= activeTab.history.length - 1}>→</button>
        <button className="browser-nav-btn" onClick={handleRefresh}>↻</button>
        
        <div className="browser-url-bar">
          <span className="browser-lock-icon">🔒</span>
          <input
            className="browser-url-input"
            value={urlInputValue}
            onChange={(e) => setUrlInputValue(e.target.value)}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigateTo(urlInputValue.trim());
            }}
            placeholder="Search or enter address"
          />
        </div>
        
        <button 
          className="browser-nav-btn" 
          onClick={() => setShowSettingsMenu(!showSettingsMenu)}
          style={{ backgroundColor: showSettingsMenu ? '#42414d' : 'transparent' }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
        </button>
        
        {showSettingsMenu && (
          <>
            <div 
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} 
              onClick={() => setShowSettingsMenu(false)}
            />
            <div className="browser-settings-menu">
              <div className="browser-settings-item" onClick={() => { handleNewTab(); setShowSettingsMenu(false); }}>
                New Tab
              </div>
              <div className="browser-settings-item" onClick={() => { useWindowStore.getState().openWindow('browser'); setShowSettingsMenu(false); }}>
                New Window
              </div>
              <div className="browser-settings-divider" />
              <div className="browser-settings-item disabled" onClick={() => setShowSettingsMenu(false)}>Bookmarks</div>
              <div className="browser-settings-item disabled" onClick={() => setShowSettingsMenu(false)}>History</div>
              <div className="browser-settings-item disabled" onClick={() => setShowSettingsMenu(false)}>Downloads</div>
              <div className="browser-settings-item disabled" onClick={() => setShowSettingsMenu(false)}>Passwords</div>
              <div className="browser-settings-divider" />
              <div className="browser-settings-item disabled" onClick={() => setShowSettingsMenu(false)}>Add-ons and themes</div>
              <div className="browser-settings-item disabled" onClick={() => setShowSettingsMenu(false)}>Settings</div>
              <div className="browser-settings-divider" />
              <div className="browser-settings-item disabled" onClick={() => setShowSettingsMenu(false)}>Help</div>
            </div>
          </>
        )}
      </div>
      
      <BrowserContent 
        url={activeTab.url}
        onNavigate={navigateTo}
        onLoad={(title) => updateTab(activeTab.id, { title })}
        onError={() => updateTab(activeTab.id, { title: 'Error loading page' })}
      />
    </div>
  );
}
