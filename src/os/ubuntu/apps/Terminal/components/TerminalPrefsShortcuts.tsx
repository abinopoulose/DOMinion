import React from 'react';

export function TerminalPrefsShortcuts() {
  return (
    <div className="term-prefs-shortcuts">
      <div className="term-prefs-list-group">
        <h3 className="term-prefs-list-title">Terminal</h3>
        <div className="term-prefs-list-card">
          <div className="term-prefs-list-row">
            <span>Copy to Clipboard</span>
            <div className="term-prefs-kbd-group">
              <kbd>Shift</kbd><kbd>Ctrl</kbd><kbd>C</kbd>
            </div>
          </div>
          <div className="term-prefs-list-row">
            <span>Paste from Clipboard</span>
            <div className="term-prefs-kbd-group">
              <kbd>Shift</kbd><kbd>Ctrl</kbd><kbd>V</kbd>
            </div>
          </div>
        </div>
        
        <div className="term-prefs-list-card" style={{ marginTop: '16px' }}>
          <div className="term-prefs-list-row">
            <span>Select All</span>
            <div className="term-prefs-kbd-group">
              <kbd>Shift</kbd><kbd>Ctrl</kbd><kbd>A</kbd>
            </div>
          </div>
          <div className="term-prefs-list-row">
            <span>Clear Selection</span>
            <span className="term-prefs-disabled-text">disabled</span>
          </div>
        </div>

        <div className="term-prefs-list-card" style={{ marginTop: '16px' }}>
          <div className="term-prefs-list-row">
            <span>Reset</span>
            <span className="term-prefs-disabled-text">disabled</span>
          </div>
          <div className="term-prefs-list-row">
            <span>Reset and Clear</span>
            <span className="term-prefs-disabled-text">disabled</span>
          </div>
        </div>

        <div className="term-prefs-list-card" style={{ marginTop: '16px' }}>
          <div className="term-prefs-list-row">
            <span>Search History</span>
            <div className="term-prefs-kbd-group">
              <kbd>Shift</kbd><kbd>Ctrl</kbd><kbd>F</kbd>
            </div>
          </div>
        </div>

        <div className="term-prefs-list-card" style={{ marginTop: '16px' }}>
          <div className="term-prefs-list-row">
            <span>Show Context Menu</span>
            <div className="term-prefs-kbd-group">
              <kbd>Shift</kbd><kbd>F10</kbd>
            </div>
          </div>
        </div>
      </div>
      
      <div className="term-prefs-list-group">
        <h3 className="term-prefs-list-title">Windows</h3>
        <div className="term-prefs-list-card">
          <div className="term-prefs-list-row">
            <span>New Window</span>
            <div className="term-prefs-kbd-group">
              <kbd>Shift</kbd><kbd>Ctrl</kbd><kbd>N</kbd>
            </div>
          </div>
          <div className="term-prefs-list-row">
            <span>New Tab</span>
            <div className="term-prefs-kbd-group">
              <kbd>Shift</kbd><kbd>Ctrl</kbd><kbd>T</kbd>
            </div>
          </div>
          <div className="term-prefs-list-row">
            <span>Close Window</span>
            <div className="term-prefs-kbd-group">
              <kbd>Shift</kbd><kbd>Ctrl</kbd><kbd>Q</kbd>
            </div>
          </div>
          <div className="term-prefs-list-row">
            <span>Close Tab</span>
            <div className="term-prefs-kbd-group">
              <kbd>Shift</kbd><kbd>Ctrl</kbd><kbd>W</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
