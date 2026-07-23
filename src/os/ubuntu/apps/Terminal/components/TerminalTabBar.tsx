import React from 'react';
import { LucideX, LucidePlus } from 'lucide-react';
import type { TerminalTabState } from './TerminalSession';

interface TerminalTabBarProps {
  tabs: TerminalTabState[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabAdd: () => void;
}

export const TerminalTabBar: React.FC<TerminalTabBarProps> = ({ tabs, activeTabId, onTabSelect, onTabClose }) => {
  return (
    <div className="terminal-tab-bar">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => onTabSelect(tab.id)}
            className={`terminal-tab ${isActive ? 'terminal-tab--active' : ''}`}
            title={tab.title}
          >
            <span className="terminal-tab-title">{tab.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              onDoubleClick={(e) => e.stopPropagation()}
              className="terminal-tab-close"
              title="Close tab"
            >
              <LucideX size={14} />
            </button>
          </div>
        );
      })}
      <button 
        onClick={onTabAdd} 
        className="terminal-tab-add" 
        title="New Tab"
      >
        <LucidePlus size={16} />
      </button>
    </div>
  );
};
