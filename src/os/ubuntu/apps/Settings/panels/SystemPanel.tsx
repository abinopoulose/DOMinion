import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';
import { useSettingsStore } from '../store/useSettingsStore';
import { hardwareConfig } from '../../../../../hardware/hardwareConfig';
import { useState, useEffect } from 'react';
import { useUbuntuAuthStore } from '../../../store/useUbuntuAuthStore';
import { useUbuntuVFSStore } from '../../../store/useUbuntuVFSStore';
import { UBUNTU_ACCOUNTS } from '../../../../../config/accounts';
import './SystemPanel.css';

const SYSTEM_PAGES: { id: SystemSubPage; label: string; subtitle: string; icon: JSX.Element }[] = [
  { id: 'region-language', label: 'Region & Language', subtitle: 'System language and localization', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> },
  { id: 'date-time', label: 'Date & Time', subtitle: 'Time zone and clock settings', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { id: 'users', label: 'Users', subtitle: 'Add and remove accounts, change password', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { id: 'remote-desktop', label: 'Remote Desktop', subtitle: 'Allow this device to be used remotely', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
  { id: 'secure-shell', label: 'Secure Shell', subtitle: 'SSH network access', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg> },
  { id: 'about', label: 'About', subtitle: 'Hardware details and software versions', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> },
];

function DateTimeSubPage() {
  const [autoTime, setAutoTime] = useState(true);
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ubuntu-settings-list-group">
      <div className="ubuntu-settings-list-item clickable" onClick={() => setAutoTime(!autoTime)}>
        <span>Automatic Date & Time</span>
        <div className={`ubuntu-settings-toggle ${autoTime ? 'checked' : ''}`}>
          <div className="ubuntu-settings-toggle-knob" />
        </div>
      </div>
      <div className="ubuntu-settings-list-item">
        <span>Time</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>{time}</span>
      </div>
    </div>
  );
}

function AboutSubPage() {
  const vfsStore = useUbuntuVFSStore();
  const [deviceName, setDeviceName] = useState(() => {
    return localStorage.getItem('ubuntu-hostname') || 'ubuntu-web';
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setDeviceName(newName);
    localStorage.setItem('ubuntu-hostname', newName);
    
    // Also update VFS for terminal prompt sync
    const node = vfsStore.resolvePath('/etc/hostname');
    if (node && node.type === 'file') {
      vfsStore.updateContent(node.id, newName + '\n', 'root');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '640px', margin: '0 auto', paddingBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px 48px', gap: '16px' }}>
        <div style={{ backgroundColor: '#E95420', width: 68, height: 68, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>
          <svg width="46" height="46" viewBox="0 0 24 24" fill="#FFFFFF" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.61.455a3.41 3.41 0 0 0-3.41 3.41 3.41 3.41 0 0 0 3.41 3.41 3.41 3.41 0 0 0 3.41-3.41 3.41 3.41 0 0 0-3.41-3.41zM12.92.8C8.923.777 5.137 2.941 3.148 6.451a4.5 4.5 0 0 1 .26-.007 4.92 4.92 0 0 1 2.585.737A8.316 8.316 0 0 1 12.688 3.6 4.944 4.944 0 0 1 13.723.834 11.008 11.008 0 0 0 12.92.8zm9.226 4.994a4.915 4.915 0 0 1-1.918 2.246 8.36 8.36 0 0 1-.273 8.303 4.89 4.89 0 0 1 1.632 2.54 11.156 11.156 0 0 0 .559-13.089zM3.41 7.932A3.41 3.41 0 0 0 0 11.342a3.41 3.41 0 0 0 3.41 3.409 3.41 3.41 0 0 0 3.41-3.41 3.41 3.41 0 0 0-3.41-3.41zm2.027 7.866a4.908 4.908 0 0 1-2.915.358 11.1 11.1 0 0 0 7.991 6.698 11.234 11.234 0 0 0 2.422.249 4.879 4.879 0 0 1-.999-2.85 8.484 8.484 0 0 1-.836-.136 8.304 8.304 0 0 1-5.663-4.32zm11.405.928a3.41 3.41 0 0 0-3.41 3.41 3.41 3.41 0 0 0 3.41 3.41 3.41 3.41 0 0 0 3.41-3.41 3.41 3.41 0 0 0-3.41-3.41z"/>
          </svg>
        </div>
        <h2 style={{ margin: 0, fontSize: '48px', fontWeight: 300, color: 'var(--color-text-primary)' }}>Ubuntu</h2>
      </div>

      <div className="ubuntu-settings-list-group" style={{ marginBottom: '16px' }}>
        <div className="ubuntu-settings-list-item interactive">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1, padding: '4px 0', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', opacity: 0.8 }}>Device Name</span>
            <input 
              type="text" 
              value={deviceName}
              onChange={handleNameChange}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                fontSize: '15px',
                color: 'var(--color-text-primary)',
                outline: 'none',
                padding: 0
              }}
            />
          </div>
          <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
            <path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
        </div>
      </div>

      <div className="ubuntu-settings-list-group">
        <div className="ubuntu-settings-list-item">
          <span>Operating System</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>Ubuntu 24.04.4 LTS</span>
        </div>
        <div className="ubuntu-settings-list-item">
          <span>Hardware Model</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>{hardwareConfig.deviceModel}</span>
        </div>
        <div className="ubuntu-settings-list-item">
          <span>Processor</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>{hardwareConfig.processor}</span>
        </div>
        <div className="ubuntu-settings-list-item">
          <span>Memory</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>{hardwareConfig.memory}</span>
        </div>
        <div className="ubuntu-settings-list-item">
          <span>Disk Capacity</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>{hardwareConfig.diskCapacity}</span>
        </div>
        <div className="ubuntu-settings-list-item interactive">
          <span>System Details</span>
          <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </div>
  );
}

async function performFactoryReset() {
  // 1. Clear all IndexedDB databases
  if (window.indexedDB && indexedDB.databases) {
    try {
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
        }
      }
    } catch (_) {
      // Fallback: delete known database names
      const knownDbs = ['ubuntu-idb-storage', 'keyval-store'];
      knownDbs.forEach(name => indexedDB.deleteDatabase(name));
    }
  }

  // 2. Clear localStorage
  localStorage.clear();

  // 3. Clear sessionStorage
  sessionStorage.clear();

  // 4. Unregister all service workers
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    }
  } catch (e) {
    console.warn('Failed to unregister service workers:', e);
  }

  // 5. Clear caches
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
      }
    }
  } catch (e) {
    console.warn('Failed to clear caches:', e);
  }

  // 6. Reload the page to start fresh
  window.location.reload();
}

export function SystemPanel() {
  const { systemSubPage, setSystemSubPage, goBackFromSubPage } = useSettingsStore();
  const currentUser = useUbuntuAuthStore((s) => s.currentUser);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (systemSubPage !== 'root') {
    const pageTitle = SYSTEM_PAGES.find((p) => p.id === systemSubPage)?.label || 'System';
    
    let content = null;

    if (systemSubPage === 'region-language') {
      content = (
        <div className="ubuntu-settings-list-group">
          <div className="ubuntu-settings-list-item">
            <span>Language</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>English (United States)</span>
          </div>
          <div className="ubuntu-settings-list-item">
            <span>Formats</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>United States</span>
          </div>
        </div>
      );
    } else if (systemSubPage === 'date-time') {
      content = <DateTimeSubPage />;
    } else if (systemSubPage === 'users') {
      const account = UBUNTU_ACCOUNTS.find(a => a.username === currentUser);
      const displayName = account?.displayName || currentUser || 'User';
      const role = account?.role || 'standard';
      const initial = displayName.charAt(0).toUpperCase();

      content = (
        <div className="ubuntu-settings-list-group">
          <div className="ubuntu-settings-list-item" style={{ padding: '16px', gap: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px' }}>
              {initial}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontWeight: '500', fontSize: '18px' }}>{displayName}</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{role === 'admin' ? 'Administrator' : 'Standard User'}</span>
            </div>
          </div>
        </div>
      );
    } else if (systemSubPage === 'about') {
      content = <AboutSubPage />;
    } else {
      content = (
        <div className="ubuntu-settings-panel-empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginBottom: '16px' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <h2 style={{ fontSize: '20px', fontWeight: 'normal', margin: '0 0 8px 0', color: 'var(--color-text-primary)' }}>Disabled</h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>This feature is disabled by the host system.</p>
        </div>
      );
    }

    return (
      <SettingsPanelWrapper>
        {content}

      </SettingsPanelWrapper>
    );
  }

  return (
    <SettingsPanelWrapper>
      <div className="ubuntu-settings-list-group">
        {SYSTEM_PAGES.map((page) => (
          <div 
            key={page.id} 
            className="ubuntu-settings-list-item interactive"
            onClick={() => setSystemSubPage(page.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ opacity: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {page.icon}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '15px' }}>{page.label}</span>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', opacity: 0.7 }}>{page.subtitle}</span>
              </div>
            </div>
            <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        ))}
      </div>

      <div className="ubuntu-settings-list-group" style={{ marginTop: '24px' }}>
        <div className="ubuntu-settings-list-item interactive">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ opacity: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
              </svg>
            </div>
            <span style={{ fontSize: '15px' }}>Software Updates</span>
          </div>
          <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </div>
        <div 
          className="ubuntu-settings-list-item interactive" 
          onClick={() => setShowResetConfirm(true)}
          style={{ color: '#e5534b' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ opacity: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </div>
            <span style={{ fontSize: '15px' }}>Factory Reset</span>
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'var(--bg-window, #ffffff)',
            color: 'var(--color-text-primary, #000)',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>Factory Reset</h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--color-text-secondary, #666)' }}>
              This will erase all data, including installed apps, files, and settings. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setShowResetConfirm(false)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.2)', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: '14px' }}
              >
                Cancel
              </button>
              <button 
                onClick={performFactoryReset}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#e5534b', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
              >
                Erase All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </SettingsPanelWrapper>
  );
}
