import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';
import { useSettingsStore } from '../store/useSettingsStore';
import './MouseTouchpadPanel.css';

export function MouseTouchpadPanel() {
  const { 
    primaryButton, setPrimaryButton, 
    mouseSpeed, setMouseSpeed, 
    tapToClick, setTapToClick, 
    naturalScrolling, setNaturalScrolling 
  } = useSettingsStore();

  return (
    <SettingsPanelWrapper title="Mouse & Touchpad">
      <div className="ubuntu-settings-section-title" style={{ padding: '0 8px 8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
        General
      </div>
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '24px' }}>
        <div className="ubuntu-settings-list-item" style={{ padding: '16px', alignItems: 'flex-start', flexDirection: 'column', gap: '16px' }}>
          <span style={{ fontWeight: '500' }}>Primary Button</span>
          <div className="mouse-primary-button-toggle">
            <div 
              className={`mouse-primary-button-option ${primaryButton === 'left' ? 'active' : ''}`}
              onClick={() => setPrimaryButton('left')}
            >
              Left
            </div>
            <div 
              className={`mouse-primary-button-option ${primaryButton === 'right' ? 'active' : ''}`}
              onClick={() => setPrimaryButton('right')}
            >
              Right
            </div>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Sets the order of physical buttons on mice and touchpads.
          </span>
        </div>
      </div>

      <div className="ubuntu-settings-section-title" style={{ padding: '0 8px 8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
        Mouse
      </div>
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '24px' }}>
        <div className="ubuntu-settings-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '16px', gap: '16px' }}>
          <span style={{ fontWeight: '500' }}>Mouse Speed</span>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={mouseSpeed} 
            onChange={(e) => setMouseSpeed(parseInt(e.target.value))}
            className="mouse-speed-slider"
          />
        </div>
      </div>

      <div className="ubuntu-settings-section-title" style={{ padding: '0 8px 8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
        Touchpad
      </div>
      <div className="ubuntu-settings-list-group">
        <div className="ubuntu-settings-list-item clickable" onClick={() => setTapToClick(!tapToClick)}>
          <span>Tap to Click</span>
          <div className={`ubuntu-settings-toggle ${tapToClick ? 'checked' : ''}`} style={{ backgroundColor: tapToClick ? 'var(--color-accent)' : 'var(--color-surface-active)' }}>
            <div className="ubuntu-settings-toggle-knob" style={{ transform: tapToClick ? 'translateX(24px)' : 'translateX(0)' }} />
          </div>
        </div>
        <div className="ubuntu-settings-list-item clickable" onClick={() => setNaturalScrolling(!naturalScrolling)}>
          <span>Natural Scrolling</span>
          <div className={`ubuntu-settings-toggle ${naturalScrolling ? 'checked' : ''}`} style={{ backgroundColor: naturalScrolling ? 'var(--color-accent)' : 'var(--color-surface-active)' }}>
            <div className="ubuntu-settings-toggle-knob" style={{ transform: naturalScrolling ? 'translateX(24px)' : 'translateX(0)' }} />
          </div>
        </div>
      </div>
    </SettingsPanelWrapper>
  );
}
