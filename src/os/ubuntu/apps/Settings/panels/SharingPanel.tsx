import { useState } from 'react';
import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';
import { useUbuntuVFSStore } from '../../../store/useUbuntuVFSStore';

export function SharingPanel() {
  const vfsStore = useUbuntuVFSStore();
  const [hostname, setHostname] = useState(() => {
    return localStorage.getItem('ubuntu-hostname') || 'envyy';
  });

  const handleHostnameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setHostname(newName);
    localStorage.setItem('ubuntu-hostname', newName);
    const node = vfsStore.resolvePath('/etc/hostname');
    if (node && node.type === 'file') {
      vfsStore.updateContent(node.id, newName + '\n', 'root');
    }
  };

  return (
    <SettingsPanelWrapper>
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '24px' }}>
        <div className="ubuntu-settings-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '10px 16px', gap: '4px', position: 'relative' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', opacity: 0.8 }}>Device Name</span>
          <input 
            type="text" 
            value={hostname} 
            onChange={handleHostnameChange}
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
          <svg style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
        </div>
      </div>
      
      <div className="ubuntu-settings-list-group">
        <div className="ubuntu-settings-list-item interactive">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ opacity: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                <line x1="7" y1="2" x2="7" y2="22"></line>
                <line x1="17" y1="2" x2="17" y2="22"></line>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <line x1="2" y1="7" x2="7" y2="7"></line>
                <line x1="2" y1="17" x2="7" y2="17"></line>
                <line x1="17" y1="17" x2="22" y2="17"></line>
                <line x1="17" y1="7" x2="22" y2="7"></line>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '15px' }}>Media Sharing</span>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', opacity: 0.8 }}>Stream music, photos and videos to devices on the current network.</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px', opacity: 0.8 }}>Off</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </div>
    </SettingsPanelWrapper>
  );
}
