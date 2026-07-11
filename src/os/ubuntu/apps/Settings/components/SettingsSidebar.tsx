import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { PANELS, getIconForPanel } from '../config/panels';

export function SettingsSidebar() {
  const { activePanel, setActivePanel, isSearchActive, searchQuery, setSearchQuery } = useSettingsStore();
  
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [localSearch, setSearchQuery]);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const filteredPanels = PANELS.filter(panel => 
    panel.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="ubuntu-settings-sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
      <div 
        style={{
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          maxHeight: isSearchActive ? '60px' : '0px',
          opacity: isSearchActive ? 1 : 0,
          padding: isSearchActive ? '8px 12px' : '0 12px',
          flexShrink: 0
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--color-bg-input, #ffffff)',
          border: `1px solid ${isFocused ? 'var(--color-accent, #e95420)' : '#cfcfcf'}`,
          borderRadius: '6px',
          padding: '6px 8px',
          boxShadow: isFocused ? '0 0 0 1px var(--color-accent, #e95420)' : 'none',
          transition: 'all 0.15s ease'
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginRight: '8px', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search"
            style={{
              border: 'none',
              outline: 'none',
              flex: 1,
              fontSize: '13px',
              backgroundColor: 'transparent',
              color: 'var(--color-text-primary, #333)',
              minWidth: 0
            }}
          />
          {localSearch && (
            <div 
              onClick={() => setLocalSearch('')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                opacity: 0.5, 
                cursor: 'pointer', 
                marginLeft: '8px',
                padding: '2px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.05)',
                flexShrink: 0
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
          )}
        </div>
      </div>
      <ul className="ubuntu-settings-sidebar-list" style={{ flex: 1, overflowY: 'auto' }}>
        {filteredPanels.map((panel) => (
          <React.Fragment key={panel.id}>
            <li 
              className={`ubuntu-settings-sidebar-item ${activePanel === panel.id ? 'active' : ''}`}
              onClick={() => setActivePanel(panel.id)}
            >
              <div className="ubuntu-settings-sidebar-item-content">
                {getIconForPanel(panel.id)}
                <span>{panel.label}</span>
              </div>
            </li>
            {panel.separatorAfter && <li className="ubuntu-settings-sidebar-separator" />}
          </React.Fragment>
        ))}
      </ul>
    </aside>
  );
}
