import { SettingsPanelWrapper } from '../../components/SettingsPanelWrapper';
import { useSettingsStore, type PrivacySubPage } from '../../store/useSettingsStore';

// Import subpages
import { ConnectivityPage } from './ConnectivityPage';
import { ScreenLockPage } from './ScreenLockPage';
import { LocationPage } from './LocationPage';
import { FileHistoryPage } from './FileHistoryPage';
import { DiagnosticsPage } from './DiagnosticsPage';
import { DeviceSecurityPage } from './DeviceSecurityPage';

export function PrivacyPanel() {
  const { privacySubPage, setPrivacySubPage } = useSettingsStore();

  if (privacySubPage !== 'root') {
    let content = null;

    switch (privacySubPage) {
      case 'connectivity': content = <ConnectivityPage />; break;
      case 'screen-lock': content = <ScreenLockPage />; break;
      case 'location': content = <LocationPage />; break;
      case 'file-history': content = <FileHistoryPage />; break;
      case 'diagnostics': content = <DiagnosticsPage />; break;
      case 'device-security': content = <DeviceSecurityPage />; break;
      default: break;
    }

    return (
      <SettingsPanelWrapper>
        {content}
      </SettingsPanelWrapper>
    );
  }

  const renderNav = (label: string, subtitle: string, page: PrivacySubPage, icon: React.ReactNode) => (
    <div className="ubuntu-settings-list-item interactive" onClick={() => setPrivacySubPage(page)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
        <div style={{ opacity: 0.7, display: 'flex', alignItems: 'center' }}>
          {icon}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span>{label}</span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{subtitle}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  );

  return (
    <SettingsPanelWrapper>
      <div style={{ width: '100%', maxWidth: '680px', margin: '0 auto' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: '8px', paddingLeft: '8px' }}>
          System
        </div>
        <div className="ubuntu-settings-list-group" style={{ marginBottom: '24px' }}>
          {renderNav(
            "Connectivity", "Detect connection issues", "connectivity",
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          )}
          {renderNav(
            "Screen Lock", "Automatic screen lock", "screen-lock",
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          )}
          {renderNav(
            "Location", "Control access to your location", "location",
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          )}
          {renderNav(
            "File History & Trash", "Remove saved data and files", "file-history",
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          )}
          {renderNav(
            "Diagnostics", "Automatic problem reporting", "diagnostics",
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          )}
        </div>
        
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: '8px', paddingLeft: '8px' }}>
          Devices
        </div>
        <div className="ubuntu-settings-list-group">
          {renderNav(
            "Device Security", "Hardware security status and information", "device-security",
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          )}
        </div>
      </div>
    </SettingsPanelWrapper>
  );
}
