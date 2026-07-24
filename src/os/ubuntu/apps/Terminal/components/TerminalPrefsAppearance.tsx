import React from 'react';
import { useTerminalProfileStore } from '../store/useTerminalProfileStore';
import { themes } from '../themes';
import { LucideCheck, LucideChevronDown } from 'lucide-react';

export function TerminalPrefsAppearance() {
  const { activeProfile, updateProfile } = useTerminalProfileStore();
  
  return (
    <div className="term-prefs-appearance">
      <div className="term-prefs-section-header">
        <h3>Palette</h3>
        <button className="term-prefs-link-btn">
          <span>Show All Palettes</span>
          <LucideChevronDown size={14} />
        </button>
      </div>
      
      <div className="term-prefs-palette-grid">
        {Object.entries(themes).map(([key, theme]) => (
          <button 
            key={key} 
            className={`term-prefs-palette-card ${activeProfile.colorScheme === key ? 'active' : ''}`}
            onClick={() => updateProfile({ colorScheme: key })}
            style={{ backgroundColor: theme.background }}
          >
            <div className="term-prefs-palette-info">
              <span className="term-prefs-palette-name" style={{ color: theme.foreground }}>
                {theme.name}
              </span>
              {activeProfile.colorScheme === key && (
                <div className="term-prefs-palette-check">
                  <LucideCheck size={12} strokeWidth={3} />
                </div>
              )}
            </div>
            
            <div className="term-prefs-palette-preview">
              <span style={{ color: theme.brightBlack }}>The quick brown<br/>fox jumps over<br/>the lazy dog</span>
            </div>
            
            <div className="term-prefs-palette-swatches">
              <div style={{ backgroundColor: theme.red }} />
              <div style={{ backgroundColor: theme.green }} />
              <div style={{ backgroundColor: theme.yellow }} />
              <div style={{ backgroundColor: theme.blue }} />
              <div style={{ backgroundColor: theme.magenta }} />
              <div style={{ backgroundColor: theme.cyan }} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
