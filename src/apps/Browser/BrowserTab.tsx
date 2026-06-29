import React from 'react';
import browserIcon from '../../assets/icons/browser.svg';

interface BrowserTabProps {
  id: string;
  title: string;
  isActive: boolean;
  onClick: (id: string) => void;
  onClose: (id: string) => void;
}

export function BrowserTab({ id, title, isActive, onClick, onClose }: BrowserTabProps) {
  return (
    <div 
      className={`browser-tab ${isActive ? 'active' : ''}`} 
      onClick={() => onClick(id)}
    >
      <img src={browserIcon} alt="Tab" className="browser-tab-favicon" draggable={false} />
      <span className="browser-tab-title">{title || 'New Tab'}</span>
      <button 
        className="browser-tab-close" 
        onClick={(e) => {
          e.stopPropagation();
          onClose(id);
        }}
      >
        ×
      </button>
    </div>
  );
}
