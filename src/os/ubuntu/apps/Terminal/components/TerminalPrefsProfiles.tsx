import React from 'react';
import { useTerminalProfileStore } from '../store/useTerminalProfileStore';
import { LucidePlus, LucideMoreVertical } from 'lucide-react';
import { ToggleSwitch } from './TerminalPrefsBehavior';

export function TerminalPrefsProfiles() {
  const { profiles, activeProfileIndex, switchProfile, addProfile, updateProfile } = useTerminalProfileStore();
  const activeProfile = profiles[activeProfileIndex];

  if (!activeProfile) return null;

  return (
    <div className="term-prefs-profiles">
      <div className="term-prefs-list-group">
        <h3 className="term-prefs-list-title">Profiles</h3>
        <div className="term-prefs-list-card">
          <div className="term-prefs-list-row" style={{ padding: '8px 16px' }}>
            <select 
              className="term-prefs-profile-select"
              value={activeProfileIndex}
              onChange={(e) => switchProfile(Number(e.target.value))}
            >
              {profiles.map((p, idx) => (
                <option key={idx} value={idx}>{p.name}</option>
              ))}
            </select>
            <button className="term-prefs-icon-btn" style={{ width: 24, height: 24 }}>
              <LucideMoreVertical size={16} />
            </button>
          </div>
          <button 
            className="term-prefs-list-row term-prefs-add-btn" 
            onClick={() => addProfile(`Profile ${profiles.length + 1}`)}
          >
            <LucidePlus size={16} /> Add Profile
          </button>
        </div>
      </div>
      
      <div className="term-prefs-list-group">
        <h3 className="term-prefs-list-title">Text</h3>
        <div className="term-prefs-list-card">
          <div className="term-prefs-list-row">
            <span className="term-prefs-row-title">Font</span>
            <select
              className="term-prefs-select"
              value={activeProfile.fontFamily}
              onChange={(e) => updateProfile({ fontFamily: e.target.value })}
            >
              <option value='"Ubuntu Mono", monospace'>Ubuntu Mono</option>
              <option value='"Fira Code", monospace'>Fira Code</option>
              <option value='"JetBrains Mono", monospace'>JetBrains Mono</option>
              <option value='"Cascadia Code", monospace'>Cascadia Code</option>
              <option value='"Hack", monospace'>Hack</option>
              <option value='monospace'>System Monospace</option>
            </select>
          </div>
          <div className="term-prefs-list-row">
            <span className="term-prefs-row-title">Font Size</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="range" 
                min="10" max="24" 
                value={activeProfile.fontSize}
                onChange={(e) => updateProfile({ fontSize: Number(e.target.value) })}
                style={{ width: '100px' }}
              />
              <span style={{ fontSize: '14px', width: '20px', textAlign: 'right' }}>{activeProfile.fontSize}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="term-prefs-list-group">
        <h3 className="term-prefs-list-title">Cursor</h3>
        <div className="term-prefs-list-card">
          <div className="term-prefs-list-row">
            <span className="term-prefs-row-title">Cursor Shape</span>
            <select
              className="term-prefs-select"
              value={activeProfile.cursorStyle}
              onChange={(e) => updateProfile({ cursorStyle: e.target.value as any })}
            >
              <option value="block">Block</option>
              <option value="underline">Underline</option>
              <option value="bar">Bar</option>
            </select>
          </div>
          <label className="term-prefs-list-row">
            <div className="term-prefs-row-text">
              <span className="term-prefs-row-title">Blinking Cursor</span>
            </div>
            <ToggleSwitch checked={activeProfile.cursorBlink} onChange={(c) => updateProfile({ cursorBlink: c })} />
          </label>
        </div>
      </div>
    </div>
  );
}
