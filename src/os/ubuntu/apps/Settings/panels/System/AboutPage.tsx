import React, { useState } from 'react';
import { hardwareConfig } from '../../../../../../hardware/hardwareConfig';
import { useUbuntuVFSStore } from '../../../../store/useUbuntuVFSStore';

export function AboutPage() {
  const vfsStore = useUbuntuVFSStore();
  const [deviceName, setDeviceName] = useState(() => {
    return localStorage.getItem('ubuntu-hostname') || 'envyy';
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setDeviceName(newName);
    localStorage.setItem('ubuntu-hostname', newName);
    
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
