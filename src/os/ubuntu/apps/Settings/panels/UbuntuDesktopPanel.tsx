import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';
import { useSettingsStore } from '../store/useSettingsStore';

export function UbuntuDesktopPanel() {
  const { 
    showDesktopIcons, setShowDesktopIcons,
    dockAutoHide, setDockAutoHide,
    dockIconSize, setDockIconSize,
    dockPosition, setDockPosition 
  } = useSettingsStore();

  return (
    <SettingsPanelWrapper title="Ubuntu Desktop">
      <div className="ubuntu-settings-section-title" style={{ padding: '0 8px 8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
        Desktop Icons
      </div>
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '24px' }}>
        <div className="ubuntu-settings-list-item clickable" onClick={() => setShowDesktopIcons(!showDesktopIcons)}>
          <span>Show Personal folder</span>
          <div className={`ubuntu-settings-toggle ${showDesktopIcons ? 'checked' : ''}`} style={{ backgroundColor: showDesktopIcons ? 'var(--color-accent)' : 'var(--color-surface-active)' }}>
            <div className="ubuntu-settings-toggle-knob" style={{ transform: showDesktopIcons ? 'translateX(24px)' : 'translateX(0)' }} />
          </div>
        </div>
      </div>

      <div className="ubuntu-settings-section-title" style={{ padding: '0 8px 8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
        Dock
      </div>
      <div className="ubuntu-settings-list-group">
        <div className="ubuntu-settings-list-item clickable" onClick={() => setDockAutoHide(!dockAutoHide)}>
          <span>Auto-hide the Dock</span>
          <div className={`ubuntu-settings-toggle ${dockAutoHide ? 'checked' : ''}`} style={{ backgroundColor: dockAutoHide ? 'var(--color-accent)' : 'var(--color-surface-active)' }}>
            <div className="ubuntu-settings-toggle-knob" style={{ transform: dockAutoHide ? 'translateX(24px)' : 'translateX(0)' }} />
          </div>
        </div>
        
        <div className="ubuntu-settings-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '16px', gap: '16px' }}>
          <span style={{ fontWeight: '500' }}>Icon size</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>16</span>
            <input 
              type="range" 
              min="16" 
              max="64" 
              step="1"
              value={dockIconSize} 
              onChange={(e) => setDockIconSize(parseInt(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--color-accent)' }}
            />
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>64</span>
          </div>
        </div>

        <div className="ubuntu-settings-list-item">
          <span>Position on screen</span>
          <select 
            className="ubuntu-settings-select" 
            value={dockPosition}
            onChange={(e) => setDockPosition(e.target.value as any)}
          >
            <option value="left">Left</option>
            <option value="bottom">Bottom</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>
    </SettingsPanelWrapper>
  );
}
