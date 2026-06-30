import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';
import { useSettingsStore } from '../store/useSettingsStore';
import './MultitaskingPanel.css';

export function MultitaskingPanel() {
  const {
    hotCorner, setHotCorner,
    activeScreenEdges, setActiveScreenEdges,
    workspaceType, setWorkspaceType
  } = useSettingsStore();

  return (
    <SettingsPanelWrapper title="Multitasking">
      <div className="ubuntu-settings-section-title" style={{ padding: '0 8px 8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
        General
      </div>
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '24px' }}>
        <div className="ubuntu-settings-list-item clickable" onClick={() => setHotCorner(!hotCorner)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span>Hot Corner</span>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Open the Activities overview when the cursor goes to the top left corner.
            </span>
          </div>
          <div className={`ubuntu-settings-toggle ${hotCorner ? 'checked' : ''}`} style={{ backgroundColor: hotCorner ? 'var(--color-accent)' : 'var(--color-surface-active)' }}>
            <div className="ubuntu-settings-toggle-knob" style={{ transform: hotCorner ? 'translateX(24px)' : 'translateX(0)' }} />
          </div>
        </div>
        <div className="ubuntu-settings-list-item clickable" onClick={() => setActiveScreenEdges(!activeScreenEdges)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span>Active Screen Edges</span>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Drag windows against the top, left, and right screen edges to resize them.
            </span>
          </div>
          <div className={`ubuntu-settings-toggle ${activeScreenEdges ? 'checked' : ''}`} style={{ backgroundColor: activeScreenEdges ? 'var(--color-accent)' : 'var(--color-surface-active)' }}>
            <div className="ubuntu-settings-toggle-knob" style={{ transform: activeScreenEdges ? 'translateX(24px)' : 'translateX(0)' }} />
          </div>
        </div>
      </div>

      <div className="ubuntu-settings-section-title" style={{ padding: '0 8px 8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
        Workspaces
      </div>
      <div className="ubuntu-settings-list-group">
        <div className="ubuntu-settings-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '16px', gap: '16px' }}>
          
          <label className="multitasking-radio-container">
            <input 
              type="radio" 
              name="workspaceType" 
              value="dynamic" 
              checked={workspaceType === 'dynamic'} 
              onChange={() => setWorkspaceType('dynamic')}
            />
            <div className="multitasking-radio-content">
              <span style={{ fontWeight: '500' }}>Dynamic workspaces</span>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Automatically removes empty workspaces.
              </span>
            </div>
          </label>
          
          <label className="multitasking-radio-container">
            <input 
              type="radio" 
              name="workspaceType" 
              value="fixed" 
              checked={workspaceType === 'fixed'} 
              onChange={() => setWorkspaceType('fixed')}
            />
            <div className="multitasking-radio-content">
              <span style={{ fontWeight: '500' }}>Fixed number of workspaces</span>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Specify a number of permanent workspaces.
              </span>
            </div>
          </label>
          
        </div>
      </div>
    </SettingsPanelWrapper>
  );
}
