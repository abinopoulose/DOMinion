import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';

export function BluetoothPanel() {
  const headerToggle = (
    <div className="ubuntu-settings-toggle" style={{ backgroundColor: 'var(--color-surface-active)', opacity: 0.5, cursor: 'not-allowed' }}>
      <div className="ubuntu-settings-toggle-knob" style={{ transform: 'translateX(0)' }} />
    </div>
  );

  return (
    <SettingsPanelWrapper title="Bluetooth" headerContent={headerToggle}>
      <div className="ubuntu-settings-panel-empty-state">
        <svg 
          width="96" 
          height="96" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          style={{ opacity: 0.3, marginBottom: '24px' }}
        >
          <path d="m6.5 6.5 11 11L12 23V1l5.5 5.5-11 11" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
        <h2 style={{ fontSize: '24px', fontWeight: 'normal', margin: '0 0 8px 0', color: 'var(--color-text-primary)' }}>No Bluetooth Found</h2>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>Plug in a dongle to use Bluetooth.</p>
      </div>
    </SettingsPanelWrapper>
  );
}
