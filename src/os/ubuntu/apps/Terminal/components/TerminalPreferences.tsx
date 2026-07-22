import React, { useState } from 'react';
import { useTerminalProfileStore } from '../store/useTerminalProfileStore';
import { themes } from '../themes';
import { LucideSettings, LucideX } from 'lucide-react';
import './TerminalPreferences.css';

export function TerminalPreferences({ onClose }: { onClose?: () => void }) {
  const { activeProfile, updateProfile, resetProfile } = useTerminalProfileStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'text' | 'colors'>('text');

  return (
    <div className="term-prefs-modal">
      {/* Content */}
      <div className="term-prefs-body">
          {/* Sidebar */}
          <div className="term-prefs-sidebar">
            <button 
              className={`term-prefs-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button 
              className={`term-prefs-tab ${activeTab === 'text' ? 'active' : ''}`}
              onClick={() => setActiveTab('text')}
            >
              Text & Cursor
            </button>
            <button 
              className={`term-prefs-tab ${activeTab === 'colors' ? 'active' : ''}`}
              onClick={() => setActiveTab('colors')}
            >
              Colors
            </button>
            
            <div className="term-prefs-reset-container">
              <button 
                onClick={resetProfile}
                className="term-prefs-reset-btn"
              >
                Reset to Defaults
              </button>
            </div>
          </div>

          {/* Main Panel */}
          <div className="term-prefs-main">
            {activeTab === 'profile' && (
              <div >
                <div className="term-prefs-group">
<label className="term-prefs-label">Profile Name</label>
                  <input 
                    type="text" 
                    value={activeProfile.name}
                    onChange={(e) => updateProfile({ name: e.target.value })}
                    className="term-prefs-input"
                  />
                </div>
                <div className="term-prefs-group">
<label className="term-prefs-label">Scrollback Lines</label>
                  <input 
                    type="number" 
                    min={100} max={10000} step={100}
                    value={activeProfile.scrollbackLines}
                    onChange={(e) => updateProfile({ scrollbackLines: parseInt(e.target.value) || 1000 })}
                    className="term-prefs-input"
                  />
                  <p className="term-prefs-hint">Number of lines kept in memory.</p>
                </div>
                <div className="term-prefs-group">
<label className="term-prefs-label">Bell Style</label>
                  <select 
                    value={activeProfile.bellStyle}
                    onChange={(e) => updateProfile({ bellStyle: e.target.value as any })}
                    className="term-prefs-input"
                  >
                    <option value="none">None</option>
                    <option value="visual">Visual</option>
                    <option value="sound">Sound</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'text' && (
              <div >
                <div className="term-prefs-group">
<label className="term-prefs-label">Font Family</label>
                  <select 
                    value={activeProfile.fontFamily}
                    onChange={(e) => updateProfile({ fontFamily: e.target.value })}
                    className="term-prefs-input"
                  >
                    <option value='"Ubuntu Mono", monospace'>Ubuntu Mono</option>
                    <option value='"Fira Code", monospace'>Fira Code</option>
                    <option value='"JetBrains Mono", monospace'>JetBrains Mono</option>
                    <option value='"Courier New", monospace'>Courier New</option>
                    <option value='monospace'>System Monospace</option>
                  </select>
                </div>
                
                <div>
                  <label className="term-prefs-label term-prefs-label-flex">
                    <span>Font Size</span>
                    <span>{activeProfile.fontSize}px</span>
                  </label>
                  <input 
                    type="range" 
                    min={10} max={24} step={1}
                    value={activeProfile.fontSize}
                    onChange={(e) => updateProfile({ fontSize: parseInt(e.target.value) })}
                    className="term-prefs-input" style={{padding: 0}}
                  />
                </div>

                <div className="term-prefs-group">
<label className="term-prefs-label">Cursor Shape</label>
                  <div className="term-prefs-radio-group">
                    {(['block', 'underline', 'bar'] as const).map(shape => (
                      <label key={shape} className="term-prefs-radio-label">
                        <input 
                          type="radio" 
                          name="cursorShape" 
                          checked={activeProfile.cursorStyle === shape}
                          onChange={() => updateProfile({ cursorStyle: shape })}
                          
                        />
                        <span className="capitalize">{shape}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="term-prefs-group">
<label className="term-prefs-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={activeProfile.cursorBlink}
                      onChange={(e) => updateProfile({ cursorBlink: e.target.checked })}
                      
                    />
                    <span>Blinking Cursor</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'colors' && (
              <div >
                <div className="term-prefs-group">
<label className="term-prefs-label">Color Scheme</label>
                  <select 
                    value={activeProfile.colorScheme}
                    onChange={(e) => updateProfile({ colorScheme: e.target.value })}
                    className="term-prefs-input"
                  >
                    {Object.entries(themes).map(([key, theme]) => (
                      <option key={key} value={key}>{theme.name}</option>
                    ))}
                  </select>
                </div>

                {/* Preview block */}
                <div 
                  className="term-prefs-preview"
                  style={{ 
                    backgroundColor: themes[activeProfile.colorScheme].background,
                    color: themes[activeProfile.colorScheme].foreground 
                  }}
                >
                  <div className="term-prefs-preview-line">
                    <span style={{ color: themes[activeProfile.colorScheme].green }}>user@host</span>:
                    <span style={{ color: themes[activeProfile.colorScheme].blue }}>~</span>$ ls -la
                  </div>
                  <div className="term-prefs-preview-line">
<span style={{ color: themes[activeProfile.colorScheme].blue }}>drwxr-xr-x</span> 2 user user 4096 Jul 19 12:00 <span style={{ color: themes[activeProfile.colorScheme].blue }}>Downloads</span>
                  </div>
                  <div className="term-prefs-preview-line">
<span style={{ color: themes[activeProfile.colorScheme].green }}>-rwxr-xr-x</span> 1 user user 1024 Jul 19 12:00 <span style={{ color: themes[activeProfile.colorScheme].green }}>script.sh</span>
                  </div>
                  <div className="term-prefs-preview-line">
-rw-r--r-- 1 user user  512 Jul 19 12:00 document.txt
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
