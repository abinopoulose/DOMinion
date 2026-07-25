import { useState } from 'react';
import { useTerminalProfileStore } from '../store/useTerminalProfileStore';
import { themes } from '../themes';
import { LucideCheck, LucideChevronDown, LucideChevronUp, LucideMinus, LucidePlus, LucideChevronRight } from 'lucide-react';
import { ToggleSwitch } from './TerminalPrefsBehavior';
import { TerminalPrefsSelect } from './TerminalPrefsSelect';
import { TerminalFontDialog } from './TerminalFontDialog';

export function TerminalPrefsAppearance() {
  const { activeProfile, updateProfile } = useTerminalProfileStore();
  const [showAllPalettes, setShowAllPalettes] = useState(false);
  const [showFontDialog, setShowFontDialog] = useState(false);

  const allThemes = Object.entries(themes);
  const visibleThemes = showAllPalettes ? allThemes : allThemes.slice(0, 12);
  
  const getFontLabel = (fontFamily: string) => {
    if (fontFamily.includes('Ubuntu Mono')) return 'Ubuntu Mono';
    if (fontFamily.includes('Fira Code')) return 'Fira Code';
    if (fontFamily.includes('JetBrains Mono')) return 'JetBrains Mono';
    if (fontFamily.includes('Cascadia Code')) return 'Cascadia Code';
    if (fontFamily.includes('Hack')) return 'Hack';
    return 'Monospace';
  };
  
  return (
    <div className="term-prefs-appearance">
      <div className="term-prefs-section-header">
        <h3>Palette</h3>
        <button className="term-prefs-link-btn" onClick={() => setShowAllPalettes(!showAllPalettes)}>
          <span>{showAllPalettes ? 'Show Fewer Palettes' : 'Show All Palettes'}</span>
          {showAllPalettes ? <LucideChevronUp size={14} /> : <LucideChevronDown size={14} />}
        </button>
      </div>
      
      <div className="term-prefs-palette-grid">
        {visibleThemes.map(([key, theme]) => (
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

      <div className="term-prefs-list-group" style={{ marginTop: '32px' }}>
        <h3 className="term-prefs-list-title">Font</h3>
        <div className="term-prefs-list-card">
          <label className="term-prefs-list-row">
            <div className="term-prefs-row-text">
              <span className="term-prefs-row-title">Use System Font</span>
            </div>
            <ToggleSwitch checked={activeProfile.useSystemFont} onChange={(c) => updateProfile({ useSystemFont: c })} />
          </label>
          
          {!activeProfile.useSystemFont && (
            <div 
              className="term-prefs-list-row" 
              style={{ cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.05)' }} 
              onClick={() => setShowFontDialog(true)}
            >
              <div className="term-prefs-row-text">
                <span className="term-prefs-row-title">Custom Font</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e4e4e7' }}>
                <span style={{ fontSize: '14px' }}>{getFontLabel(activeProfile.fontFamily)} {activeProfile.fontSize}</span>
                <LucideChevronRight size={16} />
              </div>
            </div>
          )}
        </div>
        
        {showFontDialog && (
          <TerminalFontDialog 
            initialFontFamily={activeProfile.fontFamily}
            initialFontSize={activeProfile.fontSize}
            onSelect={(fontFamily, fontSize) => {
              updateProfile({ fontFamily, fontSize });
              setShowFontDialog(false);
            }}
            onCancel={() => setShowFontDialog(false)}
          />
        )}
        
        <div className="term-prefs-list-card" style={{ marginTop: '16px' }}>
          <div className="term-prefs-list-row">
            <div className="term-prefs-row-text">
              <span className="term-prefs-row-title">Line Spacing</span>
            </div>
            <div className="term-prefs-number-ctrl">
              <span className="term-prefs-number-val">{activeProfile.lineHeight.toFixed(1)}</span>
              <button className="term-prefs-btn-circle" onClick={() => updateProfile({ lineHeight: Math.max(0.5, activeProfile.lineHeight - 0.1) })}><LucideMinus size={14} /></button>
              <button className="term-prefs-btn-circle" onClick={() => updateProfile({ lineHeight: Math.min(2.0, activeProfile.lineHeight + 0.1) })}><LucidePlus size={14} /></button>
            </div>
          </div>
          <div className="term-prefs-list-row">
            <div className="term-prefs-row-text">
              <span className="term-prefs-row-title">Column Spacing</span>
            </div>
            <div className="term-prefs-number-ctrl">
              <span className="term-prefs-number-val">{activeProfile.letterSpacing.toFixed(1)}</span>
              <button className="term-prefs-btn-circle" onClick={() => updateProfile({ letterSpacing: Math.max(0.5, activeProfile.letterSpacing - 0.1) })}><LucideMinus size={14} /></button>
              <button className="term-prefs-btn-circle" onClick={() => updateProfile({ letterSpacing: Math.min(2.0, activeProfile.letterSpacing + 0.1) })}><LucidePlus size={14} /></button>
            </div>
          </div>
        </div>

        <div className="term-prefs-list-card" style={{ marginTop: '16px' }}>
          <div className="term-prefs-list-row">
            <div className="term-prefs-row-text">
              <span className="term-prefs-row-title">Blinking Text</span>
            </div>
            <TerminalPrefsSelect 
              value={activeProfile.blinkingText} 
              onChange={(val) => updateProfile({ blinkingText: val as any })}
              options={[
                { value: 'always', label: 'Always' },
                { value: 'focused', label: 'When Focused' },
                { value: 'never', label: 'Never' }
              ]}
            />
          </div>
        </div>
      </div>

      <div className="term-prefs-list-group">
        <h3 className="term-prefs-list-title">Cursor</h3>
        <div className="term-prefs-list-card">
          <div className="term-prefs-list-row">
            <div className="term-prefs-row-text">
              <span className="term-prefs-row-title">Cursor Shape</span>
            </div>
            <TerminalPrefsSelect 
              value={activeProfile.cursorStyle} 
              onChange={(val) => updateProfile({ cursorStyle: val as any })}
              options={[
                { value: 'block', label: 'Block' },
                { value: 'underline', label: 'Underline' },
                { value: 'bar', label: 'I-Beam' }
              ]}
            />
          </div>
          <div className="term-prefs-list-row">
            <div className="term-prefs-row-text">
              <span className="term-prefs-row-title">Cursor Blinking</span>
            </div>
            <TerminalPrefsSelect 
              value={activeProfile.cursorBlink} 
              onChange={(val) => updateProfile({ cursorBlink: val as any })}
              options={[
                { value: 'system', label: 'Follow System' },
                { value: 'always', label: 'Always' },
                { value: 'never', label: 'Never' }
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
