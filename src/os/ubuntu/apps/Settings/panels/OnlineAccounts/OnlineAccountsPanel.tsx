import { useState } from 'react';
import { SettingsPanelWrapper } from '../../components/SettingsPanelWrapper';

const GoogleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.5 3H3V11.5H11.5V3Z" fill="#F25022" />
    <path d="M11.5 12.5H3V21H11.5V12.5Z" fill="#00A4EF" />
    <path d="M21 3H12.5V11.5H21V3Z" fill="#7FBA00" />
    <path d="M21 12.5H12.5V21H21V12.5Z" fill="#FFB900" />
  </svg>
);

const Microsoft365Icon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.5l8.5 4.9v9.8L12 22.1l-8.5-4.9V7.4l8.5-4.9z" fill="url(#m365grad)" />
    <path d="M12 6.5l5 2.9v5.8l-5 2.9-5-2.9V9.4l5-2.9z" fill="white" />
    <defs>
      <linearGradient id="m365grad" x1="0" y1="0" x2="24" y2="24">
        <stop stopColor="#4153AF" />
        <stop offset="0.5" stopColor="#7E3A94" />
        <stop offset="1" stopColor="#D23952" />
      </linearGradient>
    </defs>
  </svg>
);

const NextcloudIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#0082C9" />
    <path d="M12 6.5C10.5 6.5 9.2 7.3 8.5 8.5C7.2 8.5 6 9.7 6 11.2C6 12.7 7.2 13.9 8.5 13.9C9.2 15.1 10.5 15.9 12 15.9C13.5 15.9 14.8 15.1 15.5 13.9C16.8 13.9 18 12.7 18 11.2C18 9.7 16.8 8.5 15.5 8.5C14.8 7.3 13.5 6.5 12 6.5ZM12 8.5C12.8 8.5 13.5 9.1 13.5 10C13.5 10.9 12.8 11.5 12 11.5C11.2 11.5 10.5 10.9 10.5 10C10.5 9.1 11.2 8.5 12 8.5ZM8.5 10C9.3 10 10 10.6 10 11.5C10 12.4 9.3 13 8.5 13C7.7 13 7 12.4 7 11.5C7 10.6 7.7 10 8.5 10ZM15.5 10C16.3 10 17 10.6 17 11.5C17 12.4 16.3 13 15.5 13C14.7 13 14 12.4 14 11.5C14 10.6 14.7 10 15.5 10Z" fill="white" />
  </svg>
);

const ExchangeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="20" height="16" rx="2" fill="#0078D4" />
    <path d="M7 10.5H17M17 10.5L14.5 8M17 10.5L14.5 13M17 14.5H7M7 14.5L9.5 12M7 14.5L9.5 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EmailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)' }}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)' }}>
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

const KeyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)' }}>
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6" />
    <path d="m15.5 7.5 3 3L22 7l-3-3" />
  </svg>
);

const PROVIDERS = [
  { id: 'google', name: 'Google', icon: <GoogleIcon /> },
  { id: 'microsoft', name: 'Microsoft', icon: <MicrosoftIcon /> },
  { id: 'microsoft365', name: 'Microsoft 365', icon: <Microsoft365Icon /> },
  { id: 'nextcloud', name: 'Nextcloud', icon: <NextcloudIcon /> },
  { id: 'exchange', name: 'Microsoft Exchange', icon: <ExchangeIcon /> },
  { id: 'email', name: 'Email', subtitle: 'IMAP and SMTP', icon: <EmailIcon />, isSecondary: true },
  { id: 'calendar', name: 'Calendar, Contacts and Files', subtitle: 'WebDAV', icon: <CalendarIcon />, isSecondary: true },
  { id: 'enterprise', name: 'Enterprise Login', subtitle: 'Kerberos', icon: <KeyIcon />, isSecondary: true },
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

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: '-16px',
        paddingBottom: '32px'
      }}>
        <div style={{
          fontSize: '14px',
          color: 'var(--color-text-secondary)',
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          Allow apps to access online services by connecting your cloud accounts
        </div>

        <div style={{ width: '100%', maxWidth: '560px' }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '12px',
            marginLeft: '4px',
            color: 'var(--color-text)'
          }}>
            Connect an Account
          </h3>

          <div className="ubuntu-settings-list-group">
            {PROVIDERS.map(provider => (
              <div
                key={provider.id}
                className="ubuntu-settings-list-item clickable"
                onClick={() => handleConnect(provider.name)}
                style={{ padding: '12px 16px', minHeight: '56px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: provider.isSecondary ? 'var(--color-divider)' : 'transparent',
                    borderRadius: provider.isSecondary ? '50%' : '0',
                    width: '32px',
                    height: '32px',
                    flexShrink: 0
                  }}>
                    {provider.icon}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ fontWeight: '400', fontSize: '14px', color: 'var(--color-text)' }}>{provider.name}</span>
                    {provider.subtitle && (
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        {provider.subtitle}
                      </span>
                    )}
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-tertiary)', flexShrink: 0, opacity: 0.5 }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SettingsPanelWrapper>
  );
}
