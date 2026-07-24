import React, { useEffect } from 'react';
import { LucideX, LucideExternalLink, LucideChevronRight } from 'lucide-react';
import { BRANDING } from '../../../../../config/branding';
import './TerminalAboutDialog.css';

interface TerminalAboutDialogProps {
  onClose: () => void;
}

export const TerminalAboutDialog: React.FC<TerminalAboutDialogProps> = ({ onClose }) => {
  // close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="terminal-about-overlay" onClick={onClose} onMouseDown={(e) => e.stopPropagation()}>
      <div className="terminal-about-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="terminal-about-close" onClick={onClose}>
          <LucideX size={14} strokeWidth={3} />
        </button>
        
        <div className="terminal-about-header">
          <div className="terminal-about-icon">
            <span className="terminal-about-icon-text">{'>_'}</span>
          </div>
          <h2 className="terminal-about-title">Terminal</h2>
          <p className="terminal-about-author">Abino Poulose</p>
          <div className="terminal-about-version">50.1</div>
        </div>

        <div className="terminal-about-list">
          <button className="terminal-about-list-item" onClick={() => window.open(BRANDING.devWebsite, '_blank')}>
            <span>Website</span>
            <LucideExternalLink size={16} className="terminal-about-list-icon" />
          </button>
        </div>

        <div className="terminal-about-list">
          <button className="terminal-about-list-item" onClick={() => window.open(`mailto:${BRANDING.developerEmail}`, '_blank')}>
            <span>Report an Issue</span>
            <LucideExternalLink size={16} className="terminal-about-list-icon" />
          </button>
          <button className="terminal-about-list-item" onClick={() => {
            alert("To troubleshoot, please open your browser's Developer Tools (Press F12 or Ctrl+Shift+I).");
            console.log("--- DOMinion Troubleshooting ---");
          }}>
            <span>Troubleshooting</span>
            <LucideChevronRight size={16} className="terminal-about-list-icon" />
          </button>
        </div>

        <div className="terminal-about-list">
          <button className="terminal-about-list-item">
            <span>Credits</span>
            <LucideChevronRight size={16} className="terminal-about-list-icon" />
          </button>
          <button className="terminal-about-list-item">
            <span>Legal</span>
            <LucideChevronRight size={16} className="terminal-about-list-icon" />
          </button>
        </div>
      </div>
    </div>
  );
};
