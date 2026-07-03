import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';
import { useSettingsStore } from '../store/useSettingsStore';
import { hardwareConfig } from '../../../../../hardware/hardwareConfig';
import { useState, useEffect } from 'react';
import type { SystemSubPage } from '../store/useSettingsStore';
import { useUbuntuAuthStore } from '../../../store/useUbuntuAuthStore';
import { UBUNTU_ACCOUNTS } from '../../../../../config/accounts';
import './SystemPanel.css';

const SYSTEM_PAGES: { id: SystemSubPage; label: string; icon: JSX.Element }[] = [
  { id: 'region-language', label: 'Region & Language', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
  { id: 'date-time', label: 'Date & Time', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { id: 'users', label: 'Users', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { id: 'remote-desktop', label: 'Remote Desktop', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
  { id: 'secure-shell', label: 'Secure Shell', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg> },
  { id: 'about', label: 'About', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> },
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
    
    const backButton = (
      <button className="ubuntu-settings-back-button" onClick={goBackFromSubPage}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>
    );

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
      content = (
        <div className="ubuntu-settings-list-group">
          <div className="ubuntu-settings-list-item" style={{ flexDirection: 'column', alignItems: 'center', padding: '32px 16px', gap: '16px' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent)' }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
            <h2 style={{ margin: 0 }}>Ubuntu 24.04 LTS</h2>
          </div>
          <div className="ubuntu-settings-list-item">
            <span>Hardware Model</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>{hardwareConfig.deviceModel}</span>
          </div>
          <div className="ubuntu-settings-list-item">
            <span>Memory</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>{hardwareConfig.memory}</span>
          </div>
          <div className="ubuntu-settings-list-item">
            <span>Processor</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>{hardwareConfig.processor}</span>
          </div>
          <div className="ubuntu-settings-list-item">
            <span>Graphics</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>{hardwareConfig.graphics}</span>
          </div>
          <div className="ubuntu-settings-list-item">
            <span>Disk Capacity</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>{hardwareConfig.diskCapacity}</span>
          </div>
          <div className="ubuntu-settings-list-item">
            <span>OS Type</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>64-bit</span>
          </div>
          <div className="ubuntu-settings-list-item">
            <span>Windowing System</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>Wayland</span>
          </div>
        </div>
      );
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
      <SettingsPanelWrapper title={pageTitle} leftHeaderContent={backButton}>
        {content}

      </SettingsPanelWrapper>
    );
  }

  return (
    <SettingsPanelWrapper title="System">
      <div className="ubuntu-settings-list-group">
        {SYSTEM_PAGES.map((page) => (
          <div 
            key={page.id} 
            className="ubuntu-settings-list-item clickable"
            onClick={() => setSystemSubPage(page.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ opacity: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {page.icon}
              </div>
              <span>{page.label}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        ))}
      </div>

      {/* Factory Reset Section */}
      <div className="ubuntu-settings-list-group" style={{ marginTop: '24px' }}>
        <div className="ubuntu-settings-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
          <div>
            <span style={{ fontWeight: 500 }}>Factory Reset</span>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
              Clears all local browser data (IndexedDB, localStorage, caches) and reloads the application from scratch. All settings, files, and user data will be erased.
            </p>
          </div>
          {!showResetConfirm ? (
            <button
              className="system-factory-reset-btn"
              onClick={() => setShowResetConfirm(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Reset to Factory Defaults
            </button>
          ) : (
            <div className="system-factory-reset-confirm">
              <p style={{ fontSize: '13px', color: '#c01c28', fontWeight: 500, margin: '0 0 8px 0' }}>
                ⚠ This action cannot be undone. All data will be permanently deleted.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="system-factory-reset-btn system-factory-reset-btn--danger"
                  onClick={performFactoryReset}
                >
                  Yes, Erase Everything
                </button>
                <button
                  className="system-factory-reset-btn system-factory-reset-btn--cancel"
                  onClick={() => setShowResetConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SettingsPanelWrapper>
  );
}
