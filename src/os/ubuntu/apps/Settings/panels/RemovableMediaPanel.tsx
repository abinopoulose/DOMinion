import { useState } from 'react';
import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';

export function RemovableMediaPanel() {
  const [neverPrompt, setNeverPrompt] = useState(false);

  const headerToggle = (
    <div className="ubuntu-settings-toggle-container" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '14px', fontWeight: '500', display: 'none' }}>Never prompt or start programs</span>
      <div 
        className={`ubuntu-settings-toggle ${neverPrompt ? 'checked' : ''}`} 
        style={{ backgroundColor: neverPrompt ? 'var(--color-accent)' : 'var(--color-surface-active)' }}
        onClick={() => setNeverPrompt(!neverPrompt)}
        title="Never prompt or start programs on media insertion"
      >
        <div className="ubuntu-settings-toggle-knob" style={{ transform: neverPrompt ? 'translateX(24px)' : 'translateX(0)' }} />
      </div>
    </div>
  );

  return (
    <SettingsPanelWrapper title="Removable Media" headerContent={headerToggle}>
      <div className="ubuntu-settings-section-title" style={{ padding: '0 8px 8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
        Select how media should be handled
      </div>
      
      <div className="ubuntu-settings-list-group" style={{ opacity: neverPrompt ? 0.5 : 1, pointerEvents: neverPrompt ? 'none' : 'auto' }}>
        <div className="ubuntu-settings-list-item">
          <span>Audio CD</span>
          <select className="ubuntu-settings-select" defaultValue="ask">
            <option value="ask">Ask what to do</option>
            <option value="ignore">Do nothing</option>
            <option value="folder">Open folder</option>
          </select>
        </div>
        
        <div className="ubuntu-settings-list-item">
          <span>Video DVD</span>
          <select className="ubuntu-settings-select" defaultValue="ask">
            <option value="ask">Ask what to do</option>
            <option value="ignore">Do nothing</option>
            <option value="folder">Open folder</option>
          </select>
        </div>
        
        <div className="ubuntu-settings-list-item">
          <span>Music Player</span>
          <select className="ubuntu-settings-select" defaultValue="ask">
            <option value="ask">Ask what to do</option>
            <option value="ignore">Do nothing</option>
            <option value="folder">Open folder</option>
          </select>
        </div>
        
        <div className="ubuntu-settings-list-item">
          <span>Photos</span>
          <select className="ubuntu-settings-select" defaultValue="ask">
            <option value="ask">Ask what to do</option>
            <option value="ignore">Do nothing</option>
            <option value="folder">Open folder</option>
          </select>
        </div>
        
        <div className="ubuntu-settings-list-item">
          <span>Software</span>
          <select className="ubuntu-settings-select" defaultValue="ask">
            <option value="ask">Ask what to do</option>
            <option value="ignore">Do nothing</option>
            <option value="run">Run Software</option>
          </select>
        </div>
      </div>
    </SettingsPanelWrapper>
  );
}
