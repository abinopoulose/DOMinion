import React, { useState } from 'react';
import { SettingsPanelWrapper } from '../../components/SettingsPanelWrapper';
import { useSettingsStore, type SystemSubPage } from '../../store/useSettingsStore';
import { downloadRemainingFiles } from '../../../../utils/downloadRemainingFiles';
import './SystemPanel.css';

// Import subpages
import { DateTimePage } from './DateTimePage';
import { AboutPage } from './AboutPage';
import { UsersPage } from './UsersPage';
import { RegionLanguagePage } from './RegionLanguagePage';

const SYSTEM_PAGES: { id: SystemSubPage; label: string; subtitle: string; icon: React.ReactNode }[] = [
  { id: 'region-language', label: 'Region & Language', subtitle: 'System language and localization', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> },
  { id: 'date-time', label: 'Date & Time', subtitle: 'Time zone and clock settings', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { id: 'users', label: 'Users', subtitle: 'Add and remove accounts, change password', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { id: 'remote-desktop', label: 'Remote Desktop', subtitle: 'Allow this device to be used remotely', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
  { id: 'secure-shell', label: 'Secure Shell', subtitle: 'SSH network access', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg> },
  { id: 'about', label: 'About', subtitle: 'Hardware details and software versions', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> },
];

async function performFactoryReset() {
  console.log('[Factory Reset] Starting...');

  // 0. Close any active VFS database connections first
  try {
    const { closeDB } = await import('../../../../fs/db');
    await closeDB();
    console.log('[Factory Reset] Closed active VFS DB connection.');
  } catch (e) {
    console.warn('[Factory Reset] Failed to close VFS DB:', e);
  }

  // 1. Clear all IndexedDB databases
  const deleteIDB = (name: string) => {
    return new Promise<void>((resolve) => {
      console.log(`[Factory Reset] Deleting IndexedDB: ${name}`);
      const req = indexedDB.deleteDatabase(name);
      req.onsuccess = () => { console.log(`[Factory Reset] Deleted: ${name}`); resolve(); };
      req.onerror = () => { console.warn(`[Factory Reset] Error deleting: ${name}`); resolve(); };
      req.onblocked = () => { console.warn(`[Factory Reset] Blocked deleting: ${name}, forcing resolve.`); resolve(); };
    });
  };

  if (window.indexedDB) {
    try {
      if (indexedDB.databases) {
        const dbs = await indexedDB.databases();
        for (const db of dbs) {
          if (db.name) {
            await deleteIDB(db.name);
          }
        }
      } else {
        throw new Error('databases() not supported');
      }
    } catch (_) {
      const knownDbs = ['ubuntu-idb-storage', 'keyval-store', 'ubuntu-vfs'];
      for (const name of knownDbs) {
        await deleteIDB(name);
      }
    }
  }

  // 2. Clear localStorage
  localStorage.clear();
  console.log('[Factory Reset] localStorage cleared.');

  // 3. Clear sessionStorage
  sessionStorage.clear();

  // Clear all cookies
  try {
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  } catch (e) {
    console.warn('Failed to clear cookies', e);
  }

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

  console.log('[Factory Reset] Complete. Reloading...');
  // 6. Reload the page to start fresh, bypassing cache with a query param
  window.location.href = window.location.pathname + '?reset=' + Date.now();
}

export function SystemPanel() {
  const { systemSubPage, setSystemSubPage } = useSettingsStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(-1);
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) {
    throw new Error("This is a deliberate crash initiated by the user to test the Ubuntu Error Boundary.");
  }

  const handleDownloadRemainingFiles = async () => {
    if (downloadProgress >= 0) return;
    setDownloadProgress(0);
    await downloadRemainingFiles(setDownloadProgress);
    setTimeout(() => setDownloadProgress(-1), 2000);
  };

  if (systemSubPage !== 'root') {
    
    let content = null;

    if (systemSubPage === 'region-language') {
      content = <RegionLanguagePage />;
    } else if (systemSubPage === 'date-time') {
      content = <DateTimePage />;
    } else if (systemSubPage === 'users') {
      content = <UsersPage />;
    } else if (systemSubPage === 'about') {
      content = <AboutPage />;
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

        <div 
          className="ubuntu-settings-list-item interactive" 
          onClick={handleDownloadRemainingFiles}
          style={{ cursor: downloadProgress >= 0 ? 'default' : 'pointer', opacity: downloadProgress >= 0 ? 0.7 : 1 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            <div style={{ opacity: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {downloadProgress === 100 ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" color="var(--color-accent)">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' }}>
              <span style={{ fontSize: '15px' }}>
                {downloadProgress === 100 ? 'All files downloaded' : downloadProgress >= 0 ? `Downloading remaining files... ${downloadProgress}%` : 'Download Remaining Files'}
              </span>
              {downloadProgress >= 0 && (
                <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${downloadProgress}%`, height: '100%', background: 'var(--color-accent)', transition: 'width 0.1s linear' }} />
                </div>
              )}
            </div>
          </div>
          {downloadProgress >= 0 && downloadProgress < 100 && (
            <div style={{ 
              width: '16px', 
              height: '16px', 
              border: '2px solid rgba(255,255,255,0.2)', 
              borderTop: '2px solid var(--color-accent)', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite' 
            }} />
          )}
        </div>
        
        <div 
          className="ubuntu-settings-list-item interactive" 
          onClick={() => setShouldCrash(true)}
          style={{ color: '#e5534b' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ opacity: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <span style={{ fontSize: '15px' }}>Test Error Boundary</span>
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
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </SettingsPanelWrapper>
  );
}
