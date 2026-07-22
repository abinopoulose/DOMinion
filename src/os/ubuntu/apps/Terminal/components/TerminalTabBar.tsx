import React from 'react';
import { LucideX } from 'lucide-react';
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
    <div className="terminal-tab-bar" style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '6px', backgroundColor: '#26071C', userSelect: 'none', minHeight: '40px', boxSizing: 'border-box' }}>
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
    </div>
  );
};
