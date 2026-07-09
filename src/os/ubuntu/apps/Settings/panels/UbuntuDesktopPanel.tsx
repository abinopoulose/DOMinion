import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';
import { SettingsDropdown } from '../components/SettingsDropdown';
import { useSettingsStore } from '../store/useSettingsStore';

export function UbuntuDesktopPanel() {
  const { 
    dockAutoHide, setDockAutoHide,
    dockIconSize, setDockIconSize,
    dockPosition, setDockPosition,
    showTrashInDock, setShowTrashInDock
  } = useSettingsStore();

  const chevronDown = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );

  const chevronRight = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  );

  return (
    <SettingsPanelWrapper>
      
      {/* Desktop Icons Section */}
      <div style={{ padding: '0 8px 8px', fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
        Desktop Icons
      </div>
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '32px' }}>
        <div className="ubuntu-settings-list-item interactive">
          <span>Show on</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Primary Display (1)</span>
            {chevronDown}
          </div>
        </div>

        <div className="ubuntu-settings-list-item interactive">
          <span>Position of New Icons</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Bottom Right</span>
            {chevronDown}
          </div>
        </div>
        <div className="ubuntu-settings-list-item interactive">
          <span>Show Home Folder</span>
          <div className="ubuntu-settings-toggle checked" style={{ backgroundColor: 'var(--color-accent)' }}>
            <div className="ubuntu-settings-toggle-knob" style={{ transform: 'translateX(20px)' }} />
          </div>
        </div>
      </div>

      {/* Dock Section */}
      <div style={{ padding: '0 8px 8px', fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
        Dock
      </div>
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '32px' }}>
        <div className="ubuntu-settings-list-item interactive" onClick={() => setDockAutoHide(!dockAutoHide)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span>Auto-hide the Dock</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', opacity: 0.8 }}>The dock hides when any windows overlap with it</span>
          </div>
          <div className={`ubuntu-settings-toggle ${dockAutoHide ? 'checked' : ''}`} style={{ backgroundColor: dockAutoHide ? 'var(--color-accent)' : 'rgba(0,0,0,0.15)' }}>
            <div className="ubuntu-settings-toggle-knob" style={{ transform: dockAutoHide ? 'translateX(20px)' : 'translateX(0)' }} />
          </div>
        </div>
        
        <div className="ubuntu-settings-list-item interactive">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span>Panel Mode</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', opacity: 0.8 }}>The dock extends to the screen edge</span>
          </div>
          <div className="ubuntu-settings-toggle checked" style={{ backgroundColor: 'var(--color-accent)' }}>
            <div className="ubuntu-settings-toggle-knob" style={{ transform: 'translateX(20px)' }} />
          </div>
        </div>

        <div className="ubuntu-settings-list-item interactive" onClick={() => setShowTrashInDock(!showTrashInDock)}>
          <span>Show Trash in Dock</span>
          <div className={`ubuntu-settings-toggle ${showTrashInDock ? 'checked' : ''}`} style={{ backgroundColor: showTrashInDock ? 'var(--color-accent)' : 'rgba(0,0,0,0.15)' }}>
            <div className="ubuntu-settings-toggle-knob" style={{ transform: showTrashInDock ? 'translateX(20px)' : 'translateX(0)' }} />
          </div>
        </div>

        <div className="ubuntu-settings-list-item">
          <span>Icon Size</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px', width: '20px', textAlign: 'right' }}>{dockIconSize}</span>
            <input 
              type="range" 
              min="16" 
              max="64" 
              value={dockIconSize} 
              onChange={(e) => setDockIconSize(parseInt(e.target.value))}
              style={{ width: '160px', accentColor: 'var(--color-accent)' }}
            />
          </div>
        </div>

        <div className="ubuntu-settings-list-item interactive" style={{ overflow: 'visible' }}>
          <span>Position on Screen</span>
          <SettingsDropdown 
            value={dockPosition}
            onChange={(value) => setDockPosition(value as any)}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'bottom', label: 'Bottom' },
              { value: 'right', label: 'Right' }
            ]}
          />
        </div>

        <div className="ubuntu-settings-list-item interactive">
          <span>Configure Dock Behavior</span>
          {chevronRight}
        </div>
      </div>

      {/* Enhanced Tiling Section */}
      <div style={{ padding: '0 8px 8px', fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
        Enhanced Tiling
      </div>
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '32px' }}>
        <div className="ubuntu-settings-list-item interactive">
          <span style={{ fontWeight: 600 }}>Enhanced Tiling</span>
          <div className="ubuntu-settings-toggle checked" style={{ backgroundColor: 'var(--color-accent)' }}>
            <div className="ubuntu-settings-toggle-knob" style={{ transform: 'translateX(20px)' }} />
          </div>
        </div>

        <div className="ubuntu-settings-list-item interactive">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span>Tiling Popup</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', opacity: 0.8 }}>Show a list of open apps to fill empty screen space after tiling a window</span>
          </div>
          <div className="ubuntu-settings-toggle checked" style={{ backgroundColor: 'var(--color-accent)' }}>
            <div className="ubuntu-settings-toggle-knob" style={{ transform: 'translateX(20px)' }} />
          </div>
        </div>

        <div className="ubuntu-settings-list-item interactive">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span>Tile Groups</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', opacity: 0.8 }}>Keep windows grouped together when tiled, so that raising one brings up the group</span>
          </div>
          <div className="ubuntu-settings-toggle checked" style={{ backgroundColor: 'var(--color-accent)' }}>
            <div className="ubuntu-settings-toggle-knob" style={{ transform: 'translateX(20px)' }} />
          </div>
        </div>
      </div>

    </SettingsPanelWrapper>
  );
}
