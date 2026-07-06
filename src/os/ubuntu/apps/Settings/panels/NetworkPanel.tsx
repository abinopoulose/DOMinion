import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';

const SectionHeader = ({ title, showAdd }: { title: string, showAdd?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 8px', color: 'var(--color-text-primary)' }}>
    <span style={{ fontSize: '14px', fontWeight: 700 }}>{title}</span>
    {showAdd && (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, cursor: 'pointer' }}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    )}
  </div>
);

const GearIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7, cursor: 'pointer' }}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export function NetworkPanel() {
  return (
    <SettingsPanelWrapper>
      <SectionHeader title="PCI Ethernet" showAdd />
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '32px' }}>
        <div className="ubuntu-settings-list-item">
          <span style={{ opacity: 0.8 }}>Cable unplugged</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="ubuntu-settings-toggle disabled" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
              <div className="ubuntu-settings-toggle-knob" style={{ transform: 'translateX(0)', boxShadow: 'none', border: '1px solid rgba(0,0,0,0.1)' }} />
            </div>
            <GearIcon />
          </div>
        </div>
      </div>

      <SectionHeader title="USB Ethernet" showAdd />
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '32px' }}>
        <div className="ubuntu-settings-list-item">
          <span style={{ opacity: 0.8 }}>Cable unplugged</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="ubuntu-settings-toggle disabled" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
              <div className="ubuntu-settings-toggle-knob" style={{ transform: 'translateX(0)', boxShadow: 'none', border: '1px solid rgba(0,0,0,0.1)' }} />
            </div>
            <GearIcon />
          </div>
        </div>
      </div>

      <SectionHeader title="VPN" showAdd />
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '32px' }}>
        <div className="ubuntu-settings-list-item">
          <span style={{ opacity: 0.8 }}>Not set up</span>
        </div>
      </div>

      <SectionHeader title="Proxy" />
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '32px' }}>
        <div className="ubuntu-settings-list-item interactive">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
              <line x1="6" y1="6" x2="6.01" y2="6" />
              <line x1="6" y1="18" x2="6.01" y2="18" />
            </svg>
            <span>Proxy</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Off</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </div>
    </SettingsPanelWrapper>
  );
}
