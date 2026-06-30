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

export function Browser({ windowId }: BrowserProps) {
  const windowState = useWindowStore(useCallback((s) => s.windows.find((w) => w.id === windowId), [windowId]));
  const updateAppState = useWindowStore((s) => s.updateAppState);
  const updateWindowTitle = useWindowStore((s) => s.updateWindowTitle);

  const [urlInputValue, setUrlInputValue] = useState('');

  const defaultAppState = useMemo<BrowserAppState>(() => ({
    tabs: [{ id: uuidv4(), url: '', title: 'New Tab', history: [''], historyIndex: 0 }],
    activeTabId: '',
  }), []);

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
      <div className="browser-tab-bar">
        {tabs.map((tab) => (
          <BrowserTab
            key={tab.id}
            id={tab.id}
            title={tab.title}
            isActive={tab.id === activeTabId}
            onClick={(id) => updateState({ activeTabId: id })}
            onClose={handleCloseTab}
          />
        ))}
        <button className="browser-new-tab-btn" onClick={handleNewTab}>+</button>
      </div>
      
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
