import { useNetworkStore } from '../../../store/useNetworkStore';

export function BluetoothPanel() {
  const { bluetoothEnabled, airplaneMode } = useNetworkStore();

  return (
    <div className="ubuntu-settings-panel-wrapper">
      <div className="settings-panel">
        {bluetoothEnabled ? (
          <>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary, #666)', lineHeight: 1.5, margin: '0 0 12px 0' }}>
              Visible as “pride” and available for Bluetooth file transfers. Transferred files are placed<br/>
              in the <span style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>Downloads</span> folder.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontWeight: 600, fontSize: '14px', marginBottom: '-12px', marginTop: '4px' }}>
              <span>Devices</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8">
                <path d="M21 2v6h-6"></path>
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                <path d="M3 22v-6h6"></path>
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
              </svg>
            </div>

            <div className="ubuntu-settings-list-group">
              <div className="ubuntu-settings-list-item interactive">
                <span>iClever IC-BK10 Keyboard</span>
                <span style={{ fontSize: '14px', opacity: 0.5 }}>Disconnected</span>
              </div>
            </div>
          </>
        ) : (
          <div className="ubuntu-settings-panel-empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '64px', opacity: 0.8 }}>
            <svg width="128" height="128" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '16px' }}>
              <rect x="10" y="10" width="80" height="80" rx="16" fill="#8c8c8c" />
              <path d="M48 28L58 38L50 46V54L58 62L48 72V28Z" fill="#8c8c8c" />
              <path d="M48 28L58 38L50 46M50 46L40 38M50 46V54M50 54L58 62L48 72V54M50 54L40 62" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--color-text)' }}>
              {airplaneMode ? 'Bluetooth is Disabled' : 'Bluetooth Turned Off'}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary, #666)', margin: 0 }}>
              {airplaneMode ? 'Turn off Airplane Mode to enable Bluetooth.' : 'Turn on to connect devices and receive file transfers'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
