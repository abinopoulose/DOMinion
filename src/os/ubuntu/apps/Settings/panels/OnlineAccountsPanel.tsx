import { useState } from 'react';
import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';

const PROVIDERS = [
  { id: 'google', name: 'Google', color: '#DB4437' },
  { id: 'nextcloud', name: 'Nextcloud', color: '#0082c9' },
  { id: 'microsoft', name: 'Microsoft', color: '#00a4ef' },
  { id: 'exchange', name: 'Microsoft Exchange', color: '#0078D7' },
  { id: 'lastfm', name: 'Last.fm', color: '#d51007' },
  { id: 'imap', name: 'IMAP and SMTP', color: '#666' },
  { id: 'enterprise', name: 'Enterprise Login', color: '#444' },
];

export function OnlineAccountsPanel() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleConnect = (name: string) => {
    setToastMessage(`Failed to connect to ${name}. Network is unreachable.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <SettingsPanelWrapper title="Online Accounts">
      {toastMessage && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#e74c3c',
          color: 'white',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '16px',
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}

      <div style={{ padding: '0 8px 16px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
        Connect to your data in the cloud
      </div>
      
      <div className="ubuntu-settings-list-group">
        {PROVIDERS.map(provider => (
          <div 
            key={provider.id} 
            className="ubuntu-settings-list-item clickable"
            onClick={() => handleConnect(provider.name)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '4px', backgroundColor: provider.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
                {provider.name.charAt(0)}
              </div>
              <span style={{ fontWeight: '500' }}>{provider.name}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        ))}
      </div>
    </SettingsPanelWrapper>
  );
}
