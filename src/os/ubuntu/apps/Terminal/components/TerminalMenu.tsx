import React, { useEffect, useRef } from 'react';
import { LucideMinus, LucidePlus, LucideCheck } from 'lucide-react';
import { useTerminalProfileStore } from '../store/useTerminalProfileStore';
import { useWindowStore } from '../../../store';

interface TerminalMenuProps {
  windowId: string;
  onClose: () => void;
}

export const TerminalMenu: React.FC<TerminalMenuProps> = ({ windowId, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const profile = useTerminalProfileStore(state => state.activeProfile);
  const updateProfile = useTerminalProfileStore(state => state.updateProfile);
  const openWindow = useWindowStore((state: any) => state.openWindow);
  
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleZoomOut = () => {
    if (profile.fontSize > 8) updateProfile({ fontSize: profile.fontSize - 1 });
  };
  const handleZoomReset = () => {
    updateProfile({ fontSize: 14 }); // Default
  };
  const handleZoomIn = () => {
    if (profile.fontSize < 36) updateProfile({ fontSize: profile.fontSize + 1 });
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'new-tab':
        window.dispatchEvent(new CustomEvent('terminal:new-tab', { detail: { windowId } }));
        break;
      case 'new-window':
        openWindow('terminal');
        break;
      case 'show-open-tabs':
        // Optional feature
        break;
      case 'fullscreen':
        window.dispatchEvent(new CustomEvent('terminal:fullscreen', { detail: { windowId } }));
        break;
      case 'preferences':
        openWindow('terminal-preferences');
        break;
      case 'keyboard-shortcuts':
        // Optional feature
        break;
      case 'about':
        window.dispatchEvent(new CustomEvent('terminal:about', { detail: { windowId } }));
        break;
    }
    onClose();
  };

  // Determine effective theme state (mapping for simplicity)
  const isSystem = profile.colorScheme === 'ubuntu';
  const isLight = profile.colorScheme === 'ubuntuLight';
  const isDark = profile.colorScheme === 'vscode';

  return (
    <div className="terminal-menu-popup" ref={menuRef} onDoubleClick={(e) => e.stopPropagation()}>
      <div className="terminal-menu-pointer" />
      
      {/* Themes */}
      <div className="terminal-menu-section terminal-menu-themes">
        <button 
          className={`terminal-theme-btn terminal-theme-system ${isSystem ? 'active' : ''}`}
          onClick={() => updateProfile({ colorScheme: 'ubuntu' })}
          title="System Theme"
        >
          <div className="terminal-theme-circle" />
          {isSystem && <div className="terminal-theme-check"><LucideCheck size={10} /></div>}
        </button>
        <button 
          className={`terminal-theme-btn terminal-theme-light ${isLight ? 'active' : ''}`}
          onClick={() => updateProfile({ colorScheme: 'ubuntuLight' })}
          title="Light Theme"
        >
          <div className="terminal-theme-circle" />
          {isLight && <div className="terminal-theme-check"><LucideCheck size={10} /></div>}
        </button>
        <button 
          className={`terminal-theme-btn terminal-theme-dark ${isDark ? 'active' : ''}`}
          onClick={() => updateProfile({ colorScheme: 'vscode' })}
          title="Dark Theme"
        >
          <div className="terminal-theme-circle" />
          {isDark && <div className="terminal-theme-check"><LucideCheck size={10} /></div>}
        </button>
      </div>

      <div className="terminal-menu-divider" />

      {/* Zoom */}
      <div className="terminal-menu-section terminal-menu-zoom">
        <button className="terminal-zoom-btn" onClick={handleZoomOut}><LucideMinus size={14} /></button>
        <button className="terminal-zoom-reset" onClick={handleZoomReset}>
          {Math.round((profile.fontSize / 14) * 100)}%
        </button>
        <button className="terminal-zoom-btn" onClick={handleZoomIn}><LucidePlus size={14} /></button>
      </div>

      <div className="terminal-menu-divider" />

      {/* Actions */}
      <div className="terminal-menu-list">
        <button className="terminal-menu-item" onClick={() => handleAction('new-tab')}>
          <span>New Tab</span>
          <span className="terminal-menu-shortcut">Shift+Ctrl+T</span>
        </button>
        <button className="terminal-menu-item" onClick={() => handleAction('new-window')}>
          <span>New Window</span>
          <span className="terminal-menu-shortcut">Shift+Ctrl+N</span>
        </button>
        <div className="terminal-menu-divider" />
        <button className="terminal-menu-item" onClick={() => handleAction('show-open-tabs')}>
          <span>Show Open Tabs</span>
          <span className="terminal-menu-shortcut">Shift+Ctrl+O</span>
        </button>
        <div className="terminal-menu-divider" />
        <button className="terminal-menu-item" onClick={() => handleAction('fullscreen')}>
          <span>Fullscreen</span>
          <span className="terminal-menu-shortcut">F11</span>
        </button>
        <div className="terminal-menu-divider" />
        <button className="terminal-menu-item" onClick={() => handleAction('preferences')}>
          <span>Preferences</span>
          <span className="terminal-menu-shortcut">Ctrl+,</span>
        </button>
        <button className="terminal-menu-item" onClick={() => handleAction('keyboard-shortcuts')}>
          <span>Keyboard Shortcuts</span>
          <span className="terminal-menu-shortcut">Ctrl+?</span>
        </button>
        <button className="terminal-menu-item" onClick={() => handleAction('about')}>
          <span>About</span>
        </button>
      </div>
    </div>
  );
};
