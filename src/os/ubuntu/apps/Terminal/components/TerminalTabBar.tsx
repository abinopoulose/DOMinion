import React from 'react';
import { LucidePlus, LucideX } from 'lucide-react';
import { TerminalTabState } from './TerminalSession';

interface TerminalTabBarProps {
  tabs: TerminalTabState[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabAdd: () => void;
}

export const TerminalTabBar: React.FC<TerminalTabBarProps> = ({ tabs, activeTabId, onTabSelect, onTabClose, onTabAdd }) => {
  return (
    <div className="flex items-center h-9 bg-[#1e1e1e] border-b border-black overflow-x-auto overflow-y-hidden select-none" style={{ minHeight: '36px' }}>
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => onTabSelect(tab.id)}
            className={`
              flex items-center group
              h-full px-4 min-w-[120px] max-w-[200px] 
              border-r border-black cursor-pointer
              transition-colors
              ${isActive ? 'bg-[#300a24] text-white' : 'bg-[#252526] text-gray-400 hover:bg-[#2d2d2d] hover:text-gray-200'}
            `}
            title={tab.title}
          >
            <span className="truncate flex-1 text-sm">{index + 1}. {tab.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className={`
                ml-2 p-0.5 rounded-full
                hover:bg-white/20 hover:text-white
                ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                transition-opacity
              `}
              title="Close tab"
            >
              <LucideX size={14} />
            </button>
          </div>
        );
      })}
      
      <button
        onClick={onTabAdd}
        className="h-full px-3 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2d2d2d] transition-colors"
        title="New tab (Ctrl+Shift+T)"
      >
        <LucidePlus size={16} />
      </button>
    </div>
  );
};
