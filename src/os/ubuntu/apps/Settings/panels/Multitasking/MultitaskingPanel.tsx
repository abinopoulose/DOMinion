import { SettingsPanelWrapper } from '../../components/SettingsPanelWrapper';
import { useSettingsStore } from '../../store/useSettingsStore';

export function MultitaskingPanel() {
  const {
    hotCorner, setHotCorner,
    activeScreenEdges, setActiveScreenEdges,
    workspaceType, setWorkspaceType,
    numberOfWorkspaces, setNumberOfWorkspaces,
    multiMonitorWorkspaces, setMultiMonitorWorkspaces,
    appSwitchingWorkspaces, setAppSwitchingWorkspaces,
    appSwitchingMonitors, setAppSwitchingMonitors
  } = useSettingsStore();

  return (
    <SettingsPanelWrapper title="Multitasking">
      <div style={{ padding: '16px 0 48px 0', maxWidth: '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* General Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 600, color: 'var(--color-text-primary)' }}>General</h3>
          </div>
          <div className="ubuntu-settings-list-group">
            {/* Hot Corner */}
            <div className="ubuntu-settings-list-item" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '16px', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0, paddingRight: '16px' }}>
                  <span style={{ fontWeight: 400 }}>Hot Corner</span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Touch the top-left corner to open the Activities Overview</span>
                </div>
                <div className={`ubuntu-settings-toggle ${hotCorner ? 'checked' : ''}`} onClick={() => setHotCorner(!hotCorner)} style={{ cursor: 'pointer' }}>
                  <div className="ubuntu-settings-toggle-knob" />
                </div>
              </div>
              
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <img src="/ubuntu/settings/hot_corner.png" alt="Hot Corner" style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }} />
              </div>
            </div>
            
            <div className="ubuntu-settings-list-divider" />
            
            {/* Active Screen Edges */}
            <div className="ubuntu-settings-list-item" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '16px', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0, paddingRight: '16px' }}>
                  <span style={{ fontWeight: 400 }}>Active Screen Edges</span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Drag windows against the top, left, and right screen edges to resize them</span>
                </div>
                <div className={`ubuntu-settings-toggle ${activeScreenEdges ? 'checked' : ''}`} onClick={() => setActiveScreenEdges(!activeScreenEdges)} style={{ cursor: 'pointer' }}>
                  <div className="ubuntu-settings-toggle-knob" />
                </div>
              </div>
              
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <img src="/ubuntu/settings/active_screen_edges.png" alt="Active Screen Edges" style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Workspaces Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Workspaces</h3>
          </div>
          <div className="ubuntu-settings-list-group">
            {/* Dynamic Workspaces */}
            <div className="ubuntu-settings-list-item clickable" onClick={() => setWorkspaceType('dynamic')} style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${workspaceType === 'dynamic' ? 'var(--color-accent)' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {workspaceType === 'dynamic' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-accent)' }} />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0, paddingRight: '16px' }}>
                  <span style={{ fontWeight: 400 }}>Dynamic Workspaces</span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Automatically removes empty workspaces</span>
                </div>
              </div>
            </div>
            
            <div className="ubuntu-settings-list-divider" />
            
            {/* Fixed Number of Workspaces */}
            <div className="ubuntu-settings-list-item clickable" onClick={() => setWorkspaceType('fixed')} style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${workspaceType === 'fixed' ? 'var(--color-accent)' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {workspaceType === 'fixed' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-accent)' }} />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0, paddingRight: '16px' }}>
                  <span style={{ fontWeight: 400 }}>Fixed Number of Workspaces</span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Specify a number of permanent workspaces</span>
                </div>
              </div>
            </div>
            
            <div className="ubuntu-settings-list-divider" />
            
            {/* Number of Workspaces Counter */}
            <div className={`ubuntu-settings-list-item ${workspaceType !== 'fixed' ? 'disabled' : ''}`} style={{ padding: '12px 16px', opacity: workspaceType === 'fixed' ? 1 : 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400, flex: 1, minWidth: 0, paddingRight: '16px' }}>Number of Workspaces</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{numberOfWorkspaces}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      disabled={workspaceType !== 'fixed' || numberOfWorkspaces <= 1} 
                      onClick={() => setNumberOfWorkspaces(Math.max(1, numberOfWorkspaces - 1))}
                      style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (workspaceType === 'fixed' && numberOfWorkspaces > 1) ? 'pointer' : 'default', color: 'var(--color-text-primary)' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                    <button 
                      disabled={workspaceType !== 'fixed' || numberOfWorkspaces >= 20} 
                      onClick={() => setNumberOfWorkspaces(Math.min(20, numberOfWorkspaces + 1))}
                      style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (workspaceType === 'fixed' && numberOfWorkspaces < 20) ? 'pointer' : 'default', color: 'var(--color-text-primary)' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Monitor Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Multi-Monitor</h3>
          </div>
          <div className="ubuntu-settings-list-group">
            {/* Workspaces on primary display only */}
            <div className="ubuntu-settings-list-item clickable" onClick={() => setMultiMonitorWorkspaces('primary')} style={{ flexDirection: 'column', alignItems: 'stretch', padding: '16px', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${multiMonitorWorkspaces === 'primary' ? 'var(--color-accent)' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {multiMonitorWorkspaces === 'primary' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-accent)' }} />}
                </div>
                <span style={{ fontWeight: 400 }}>Workspaces on primary display only</span>
              </div>
              
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <img src="/ubuntu/settings/workspaces_on_primary_display_only.png" alt="Workspaces on primary display only" style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }} />
              </div>
            </div>
            
            <div className="ubuntu-settings-list-divider" />
            
            {/* Workspaces on all displays */}
            <div className="ubuntu-settings-list-item clickable" onClick={() => setMultiMonitorWorkspaces('all')} style={{ flexDirection: 'column', alignItems: 'stretch', padding: '16px', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${multiMonitorWorkspaces === 'all' ? 'var(--color-accent)' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {multiMonitorWorkspaces === 'all' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-accent)' }} />}
                </div>
                <span style={{ fontWeight: 400 }}>Workspaces on all displays</span>
              </div>
              
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <img src="/ubuntu/settings/workspaces_on_all_display.png" alt="Workspaces on all displays" style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* App Switching Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 600, color: 'var(--color-text-primary)' }}>App Switching</h3>
          </div>
          <div className="ubuntu-settings-list-group">
            {/* Include apps from all workspaces */}
            <div className="ubuntu-settings-list-item clickable" onClick={() => setAppSwitchingWorkspaces('all')} style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${appSwitchingWorkspaces === 'all' ? 'var(--color-accent)' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {appSwitchingWorkspaces === 'all' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-accent)' }} />}
                </div>
                <span style={{ fontWeight: 400 }}>Include apps from all workspaces</span>
              </div>
            </div>
            
            <div className="ubuntu-settings-list-divider" />
            
            {/* Include apps from the current workspace only */}
            <div className="ubuntu-settings-list-item clickable" onClick={() => setAppSwitchingWorkspaces('current')} style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${appSwitchingWorkspaces === 'current' ? 'var(--color-accent)' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {appSwitchingWorkspaces === 'current' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-accent)' }} />}
                </div>
                <span style={{ fontWeight: 400 }}>Include apps from the current workspace only</span>
              </div>
            </div>
            
            <div className="ubuntu-settings-list-divider" />
            
            {/* Include apps from all monitors */}
            <div className="ubuntu-settings-list-item clickable" onClick={() => setAppSwitchingMonitors('all')} style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${appSwitchingMonitors === 'all' ? 'var(--color-accent)' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {appSwitchingMonitors === 'all' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-accent)' }} />}
                </div>
                <span style={{ fontWeight: 400 }}>Include apps from all monitors</span>
              </div>
            </div>
            
            <div className="ubuntu-settings-list-divider" />
            
            {/* Include apps from each monitor only */}
            <div className="ubuntu-settings-list-item clickable" onClick={() => setAppSwitchingMonitors('current')} style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${appSwitchingMonitors === 'current' ? 'var(--color-accent)' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {appSwitchingMonitors === 'current' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-accent)' }} />}
                </div>
                <span style={{ fontWeight: 400 }}>Include apps from each monitor only</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </SettingsPanelWrapper>
  );
}
