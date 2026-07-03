import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';
import { useNetworkStore } from '../../../store/useNetworkStore';

export function BluetoothPanel() {
  const { bluetoothEnabled, toggleBluetooth } = useNetworkStore();

  const headerToggle = (
    <div 
      className={`ubuntu-settings-toggle ${bluetoothEnabled ? 'checked' : ''}`}
      style={{ backgroundColor: bluetoothEnabled ? 'var(--color-accent)' : undefined }}
      onClick={toggleBluetooth}
    >
      <div className="ubuntu-settings-toggle-knob" style={{ transform: bluetoothEnabled ? 'translateX(20px)' : 'translateX(0)' }} />
    </div>
  );

  return (
    <SettingsPanelWrapper title="Bluetooth" rightHeaderContent={headerToggle}>
      {bluetoothEnabled ? (
        <div className="ubuntu-settings-panel-empty-state">
           <h2 style={{ fontSize: '24px', fontWeight: 'normal', margin: '0 0 8px 0', color: 'var(--color-text-primary)' }}>Visible Devices</h2>
           <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>Searching for devices...</p>
        </div>
      ) : (
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
          <h2 style={{ fontSize: '24px', fontWeight: 'normal', margin: '0 0 8px 0', color: 'var(--color-text-primary)' }}>Bluetooth is Off</h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>Turn on Bluetooth to connect devices.</p>
        </div>
      )}
    </SettingsPanelWrapper>
  );
}
