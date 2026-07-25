import React, { useState, useMemo } from 'react';
import { LucideSearch, LucideSlidersHorizontal, LucideChevronDown, LucideMinus, LucidePlus } from 'lucide-react';
import './TerminalFontDialog.css';

interface FontOption {
  family: string;
  name: string;
  style: React.CSSProperties;
}

const FONTS: FontOption[] = [
  { family: '"DejaVu Sans Mono", monospace', name: 'DejaVu Sans Mono Book', style: { fontWeight: 'normal', fontStyle: 'normal' } },
  { family: '"DejaVu Sans Mono", monospace', name: 'DejaVu Sans Mono Bold', style: { fontWeight: 'bold', fontStyle: 'normal' } },
  { family: '"DejaVu Sans Mono", monospace', name: 'DejaVu Sans Mono Oblique', style: { fontWeight: 'normal', fontStyle: 'italic' } },
  { family: '"DejaVu Sans Mono", monospace', name: 'DejaVu Sans Mono Bold Oblique', style: { fontWeight: 'bold', fontStyle: 'italic' } },
  
  { family: '"Liberation Mono", monospace', name: 'Liberation Mono Regular', style: { fontWeight: 'normal', fontStyle: 'normal' } },
  { family: '"Liberation Mono", monospace', name: 'Liberation Mono Bold', style: { fontWeight: 'bold', fontStyle: 'normal' } },
  { family: '"Liberation Mono", monospace', name: 'Liberation Mono Italic', style: { fontWeight: 'normal', fontStyle: 'italic' } },
  { family: '"Liberation Mono", monospace', name: 'Liberation Mono Bold Italic', style: { fontWeight: 'bold', fontStyle: 'italic' } },
  
  { family: '"Ubuntu Mono", monospace', name: 'Ubuntu Mono Regular', style: { fontWeight: 'normal', fontStyle: 'normal' } },
  { family: '"Ubuntu Mono", monospace', name: 'Ubuntu Mono Bold', style: { fontWeight: 'bold', fontStyle: 'normal' } },
  
  { family: '"Fira Code", monospace', name: 'Fira Code Regular', style: { fontWeight: 'normal', fontStyle: 'normal' } },
  { family: '"Fira Code", monospace', name: 'Fira Code Bold', style: { fontWeight: 'bold', fontStyle: 'normal' } },

  { family: '"JetBrains Mono", monospace', name: 'JetBrains Mono Regular', style: { fontWeight: 'normal', fontStyle: 'normal' } },
  { family: '"Cascadia Code", monospace', name: 'Cascadia Code Regular', style: { fontWeight: 'normal', fontStyle: 'normal' } },
  { family: '"Hack", monospace', name: 'Hack Regular', style: { fontWeight: 'normal', fontStyle: 'normal' } },
  { family: 'monospace', name: 'System Monospace', style: { fontWeight: 'normal', fontStyle: 'normal' } },
];

export interface TerminalFontDialogProps {
  initialFontFamily: string;
  initialFontSize: number;
  onSelect: (fontFamily: string, fontSize: number) => void;
  onCancel: () => void;
}

export function TerminalFontDialog({ initialFontFamily, initialFontSize, onSelect, onCancel }: TerminalFontDialogProps) {
  const [search, setSearch] = useState('');
  
  // Find initial selection or default to first
  const initialSelected = FONTS.find(f => f.family.includes(initialFontFamily.replace(/"/g, '').split(',')[0])) || FONTS[0];
  const [selectedFont, setSelectedFont] = useState<FontOption>(initialSelected);
  const [fontSize, setFontSize] = useState<number>(initialFontSize);

  const filteredFonts = useMemo(() => {
    return FONTS.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  return (
    <div className="term-font-dialog-overlay" onClick={onCancel}>
      <div className="term-font-dialog" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="term-font-dialog-header">
          <button className="term-font-dialog-btn-cancel" onClick={onCancel}>Cancel</button>
          <span className="term-font-dialog-title">Select Font</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}>
              <LucideSlidersHorizontal size={18} />
            </button>
            <button className="term-font-dialog-btn-select" onClick={() => onSelect(selectedFont.family, fontSize)}>Select</button>
          </div>
        </div>

        {/* Search */}
        <div className="term-font-dialog-search-container">
          <div className="term-font-dialog-search-wrapper">
            <LucideSearch size={16} className="term-font-dialog-search-icon" />
            <input 
              type="text" 
              className="term-font-dialog-search" 
              placeholder="Search font name" 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button style={{ background: '#404040', border: 'none', color: '#a0a0a0', width: '36px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LucideChevronDown size={16} />
          </button>
        </div>

        {/* List */}
        <div className="term-font-dialog-list">
          {filteredFonts.map((font, idx) => (
            <button
              key={idx}
              className={`term-font-dialog-list-item ${selectedFont.name === font.name ? 'selected' : ''}`}
              onClick={() => setSelectedFont(font)}
              style={{ ...font.style, fontFamily: font.family }}
            >
              {font.name}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div 
          className="term-font-dialog-preview"
          style={{ 
            fontFamily: selectedFont.family,
            ...selectedFont.style,
            fontSize: `${fontSize}px` 
          }}
        >
          The wizard quickly jinxed the gnomes before they vaporized
        </div>

        {/* Footer (Size) */}
        <div className="term-font-dialog-footer">
          <span className="term-font-dialog-size-label">Size</span>
          
          <div className="term-font-dialog-slider-container">
            <input 
              type="range" 
              min="8" 
              max="24" 
              value={fontSize} 
              onChange={e => setFontSize(Number(e.target.value))}
              className="term-font-dialog-slider"
            />
            <div className="term-font-dialog-ticks">
              {/* Generate some tick marks to match the screenshot roughly */}
              {[...Array(11)].map((_, i) => (
                <div key={i} className="term-font-dialog-tick" style={{ height: i % 2 === 0 ? '4px' : '2px' }} />
              ))}
            </div>
          </div>

          <div className="term-font-dialog-size-input-group">
            <input 
              type="text" 
              className="term-font-dialog-size-input" 
              value={fontSize}
              onChange={e => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) setFontSize(Math.min(Math.max(val, 8), 72));
              }}
            />
            <button className="term-font-dialog-size-btn" onClick={() => setFontSize(Math.max(8, fontSize - 1))}><LucideMinus size={14} /></button>
            <button className="term-font-dialog-size-btn" onClick={() => setFontSize(Math.min(72, fontSize + 1))}><LucidePlus size={14} /></button>
          </div>
        </div>

      </div>
    </div>
  );
}
