import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';

export function ColorPanel() {
  return (
    <SettingsPanelWrapper title="Color">
      <div style={{ padding: '0 8px 16px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
        Each device needs an information file (color profile) to be color managed.
      </div>
      
      <div className="ubuntu-settings-list-group">
        <div className="ubuntu-settings-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontWeight: '500' }}>Built-in Display</span>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Default Profile</span>
            </div>
          </div>
        </div>
      </div>
    </SettingsPanelWrapper>
  );
}
