import React from 'react';
import { useTerminalProfileStore } from '../store/useTerminalProfileStore';

export function ToggleSwitch({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) {
  return (
    <div 
      className={`term-prefs-toggle ${checked ? 'on' : 'off'}`} 
      onClick={() => onChange(!checked)}
    >
      <div className="term-prefs-toggle-thumb" />
    </div>
  );
}

export function TerminalPrefsBehavior() {
  const { activeProfile, updateProfile } = useTerminalProfileStore();

  return (
    <div className="term-prefs-behavior">
      <div className="term-prefs-list-group">
        <h3 className="term-prefs-list-title">Interface</h3>
        <div className="term-prefs-list-card">
          <div className="term-prefs-list-row">
            <span className="term-prefs-row-title">New Tab Position</span>
            <select 
              className="term-prefs-select"
              value={activeProfile.newTabPosition} 
              onChange={(e) => updateProfile({ newTabPosition: e.target.value as 'last' | 'next' })}
            >
              <option value="last">Last</option>
              <option value="next">Next</option>
            </select>
          </div>
        </div>
        
        <div className="term-prefs-list-card" style={{ marginTop: '16px' }}>
          <label className="term-prefs-list-row">
            <div className="term-prefs-row-text">
              <span className="term-prefs-row-title">Restore Session</span>
              <span className="term-prefs-row-desc">Attempt to restore previous tabs when terminal starts</span>
            </div>
            <ToggleSwitch checked={activeProfile.restoreSession} onChange={(c) => updateProfile({ restoreSession: c })} />
          </label>
          <label className="term-prefs-list-row">
            <div className="term-prefs-row-text">
              <span className="term-prefs-row-title">Restore Window Size</span>
              <span className="term-prefs-row-desc">Restore the previous window size when creating a new window</span>
            </div>
            <ToggleSwitch checked={activeProfile.restoreWindowSize} onChange={(c) => updateProfile({ restoreWindowSize: c })} />
          </label>
        </div>
      </div>

      <div className="term-prefs-list-group">
        <h3 className="term-prefs-list-title">Accessibility</h3>
        <div className="term-prefs-list-card">
          <label className="term-prefs-list-row">
            <div className="term-prefs-row-text">
              <span className="term-prefs-row-title">Allow Screen Readers</span>
              <span className="term-prefs-row-desc">Permit screen readers such as Orca to read terminal content</span>
            </div>
            <ToggleSwitch checked={activeProfile.allowScreenReaders} onChange={(c) => updateProfile({ allowScreenReaders: c })} />
          </label>
        </div>
      </div>

      <div className="term-prefs-list-group">
        <h3 className="term-prefs-list-title">Bell</h3>
        <div className="term-prefs-list-card">
          <label className="term-prefs-list-row">
            <div className="term-prefs-row-text">
              <span className="term-prefs-row-title">Audible Bell</span>
              <span className="term-prefs-row-desc">Emit an audible bell when requested by active tab</span>
            </div>
            <ToggleSwitch checked={activeProfile.audibleBell} onChange={(c) => updateProfile({ audibleBell: c })} />
          </label>
          <label className="term-prefs-list-row">
            <div className="term-prefs-row-text">
              <span className="term-prefs-row-title">Visual Bell</span>
              <span className="term-prefs-row-desc">Emit a visual bell when requested by active tab</span>
            </div>
            <ToggleSwitch checked={activeProfile.visualBell} onChange={(c) => updateProfile({ visualBell: c })} />
          </label>
        </div>
      </div>
      
      <div className="term-prefs-list-group">
        <h3 className="term-prefs-list-title">Scrolling</h3>
        <div className="term-prefs-list-card">
          <div className="term-prefs-list-row">
            <span className="term-prefs-row-title">Use Scrollbars</span>
            <select 
              className="term-prefs-select"
              value={activeProfile.useScrollbars} 
              onChange={(e) => updateProfile({ useScrollbars: e.target.value as 'always' | 'never' | 'system' })}
            >
              <option value="system">Follow System</option>
              <option value="always">Always</option>
              <option value="never">Never</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
