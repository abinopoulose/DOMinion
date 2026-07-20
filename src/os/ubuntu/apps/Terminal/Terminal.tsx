import { useEffect, useState, useCallback, useMemo } from 'react';
import { useWindowAPI } from '../../hooks/useWindowAPI';
import { useWindowStore } from '../../store';
import { TerminalPreferences } from './components/TerminalPreferences';
import { TerminalTabBar } from './components/TerminalTabBar';
import { TerminalSession, TerminalTabState } from './components/TerminalSession';
import { useTerminalProfileStore } from './store/useTerminalProfileStore';
import { themes } from './themes';
import { LucideSettings } from 'lucide-react';
import './Terminal.css';

interface TerminalProps {
  windowId: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export function Terminal({ windowId }: TerminalProps) {
  const { updateState, getState, closeWindow } = useWindowAPI(windowId);
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

  const [showPreferences, setShowPreferences] = useState(false);
  const profile = useTerminalProfileStore(state => state.activeProfile);
  const theme = themes[profile.colorScheme] || themes['ubuntu'];

  // Sync state to window manager periodically or on unmount
  useEffect(() => {
    updateState({ tabs, activeTabId });
  }, [tabs, activeTabId, updateState]);

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
        closeWindow();
        return prev; // Window is closing anyway
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
  }, [activeTabId, closeWindow]);

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
      className="terminal-app flex flex-col w-full h-full outline-none" 
      style={{ backgroundColor: theme.background }}
      onKeyDown={handleKeyDown}
      tabIndex={-1} // Allow div to receive keyboard events
    >
      {showPreferences && <TerminalPreferences onClose={() => setShowPreferences(false)} />}
      
      {/* Tab Bar */}
      {tabs.length > 1 && (
        <TerminalTabBar 
          tabs={tabs} 
          activeTabId={activeTabId} 
          onTabSelect={setActiveTabId} 
          onTabClose={handleCloseTab} 
          onTabAdd={handleAddTab}
        />
      )}

      {/* Settings Header Button - normally part of window controls, but we add it here for Terminal */}
      <div className="absolute top-1 right-2 z-10 opacity-30 hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setShowPreferences(true)}
          className="p-1.5 rounded hover:bg-white/20 text-white"
          title="Terminal Preferences"
        >
          <LucideSettings size={14} />
        </button>
      </div>

      {/* Terminal Sessions */}
      <div className="flex-1 relative flex">
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
    </div>
  );
}

export function TerminalHeaderControls({ windowId }: { windowId: string }) {
  // Empty, keeping it consistent with the internal header button above.
  return null;
}
