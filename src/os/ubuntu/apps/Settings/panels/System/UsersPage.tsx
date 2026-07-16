import React, { useState } from 'react';
import { UBUNTU_ACCOUNTS, updateUbuntuAccount } from '../../../../../../config/accounts';
import { useUbuntuAuthStore } from '../../../../store/useUbuntuAuthStore';
import { useSystemDialogStore } from '../../../../store/useSystemDialogStore';
import { useUbuntuVFSStore } from '../../../../store';
import { hashPassword } from '../../../../utils/passwordHasher';

export function UsersPage() {
  const currentUser = useUbuntuAuthStore((s) => s.currentUser);
  const openPolkitDialog = useSystemDialogStore((s) => s.openPolkitDialog);
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isNameEditing, setIsNameEditing] = useState(false);
  const nameInputRef = React.useRef<HTMLInputElement>(null);
  
  const account = UBUNTU_ACCOUNTS.find((a: any) => a.username === currentUser);
  
  const [displayName, setDisplayName] = useState(account?.displayName || currentUser || 'User');
  const [password, setPassword] = useState(account?.password || '');
  const [autoLogin, setAutoLogin] = useState(!!account?.autoLogin);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Modal state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  
  const initial = displayName.charAt(0).toUpperCase();

  const handleUnlock = () => {
    openPolkitDialog({
      message: 'Authentication is required to change user data',
      actionId: 'org.freedesktop.accounts.change-data',
      requireAdmin: false,
      onSuccess: () => setIsUnlocked(true),
    });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayName(e.target.value);
    if (currentUser) updateUbuntuAccount(currentUser, { displayName: e.target.value });
  };

  const handlePasswordSubmit = async () => {
    if (currentPassword === password && newPassword && newPassword === confirmPassword) {
      setPassword(newPassword);
      if (currentUser) {
        updateUbuntuAccount(currentUser, { password: newPassword });
        
        // Critically, we must also update the Virtual File System's shadow file, 
        // as the Login and Sudo services prioritize reading from /etc/shadow!
        const store = useUbuntuVFSStore.getState();
        const shadowNode = store.resolvePath('/etc/shadow');
        if (shadowNode && shadowNode.type === 'file') {
          const newHash = await hashPassword(newPassword);
          const lines = shadowNode.content.split('\n');
          const newLines = lines.map(line => {
            if (line.startsWith(currentUser + ':')) {
              const parts = line.split(':');
              parts[1] = newHash;
              return parts.join(':');
            }
            return line;
          });
          store.updateContent(shadowNode.id, newLines.join('\n'), 'root');
        }
      }
      
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {!isUnlocked && (
        <div style={{
          margin: '-36px -36px 36px -36px',
          padding: '10px 24px',
          backgroundColor: '#8b4a3a',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          borderBottom: '1px solid rgba(0,0,0,0.1)'
        }}>
          <span style={{ fontSize: '13px', fontWeight: 500 }}>Some settings are locked</span>
          <button 
            onClick={handleUnlock}
            style={{ 
              position: 'absolute',
              right: '12px',
              padding: '6px 14px', 
              backgroundColor: 'rgba(255, 255, 255, 0.1)', 
              border: '1px solid rgba(255, 255, 255, 0.2)', 
              color: 'white', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500
            }}>
            Unlock...
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '460px', margin: '0 auto', width: '100%' }}>
        
        {/* Avatar */}
        <div style={{ position: 'relative', marginBottom: '32px' }}>
          <div style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: '#c778c9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '36px', fontWeight: 300 }}>
            {initial}
          </div>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#333', border: '2px solid var(--bg-window)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isUnlocked ? 'pointer' : 'default', opacity: isUnlocked ? 1 : 0.5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </div>
        </div>

        {/* User Card */}
        <div className="ubuntu-settings-list-group" style={{ width: '100%', marginBottom: '24px' }}>
          <div className="ubuntu-settings-list-item" style={{ padding: '8px 16px', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '2px' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Name</span>
              <input 
                ref={nameInputRef}
                type="text" 
                value={displayName} 
                onChange={handleNameChange}
                onBlur={() => setIsNameEditing(false)}
                onKeyDown={(e) => { if (e.key === 'Enter') setIsNameEditing(false); }}
                disabled={!isNameEditing}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', fontSize: '14px', outline: 'none', padding: '0', width: '100%', marginBottom: '4px', borderRadius: '4px', transition: 'all 0.2s' }} 
              />
            </div>
            <div 
              style={{ cursor: isUnlocked ? 'pointer' : 'default', opacity: isUnlocked ? 1 : 0.5, padding: '4px' }}
              onClick={() => {
                if (isUnlocked) {
                  setIsNameEditing(true);
                  setTimeout(() => nameInputRef.current?.focus(), 50);
                }
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </div>
          </div>
          
          <div 
            className={`ubuntu-settings-list-item ${isUnlocked ? 'interactive' : ''}`} 
            style={{ padding: '16px', gap: '16px' }}
            onClick={() => isUnlocked && setShowPasswordModal(true)}
          >
            <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px' }}>Password</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', letterSpacing: '2px' }}>•••••</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </div>
          </div>

          <div className="ubuntu-settings-list-item" style={{ padding: '16px', gap: '16px' }}>
            <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: isUnlocked ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>Automatic Login</span>
              <div 
                className={`ubuntu-settings-toggle ${autoLogin ? 'checked' : ''} ${!isUnlocked ? 'disabled' : ''}`} 
                onClick={() => {
                  if (isUnlocked) {
                    const newValue = !autoLogin;
                    setAutoLogin(newValue);
                    if (currentUser) updateUbuntuAccount(currentUser, { autoLogin: newValue });
                  }
                }}
              >
                <div className="ubuntu-settings-toggle-knob" />
              </div>
            </div>
          </div>
        </div>

        {/* Language Card */}
        <div className="ubuntu-settings-list-group" style={{ width: '100%', marginBottom: '24px' }}>
          <div className="ubuntu-settings-list-item interactive" style={{ padding: '16px', gap: '16px' }}>
            <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px' }}>Language</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>English (United States)</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-window)',
            borderRadius: '12px',
            width: '450px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid rgba(0,0,0,0.1)'
            }}>
              <button 
                onClick={() => setShowPasswordModal(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--color-text-primary)', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
              >
                Cancel
              </button>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>Change Password</span>
              <button 
                onClick={handlePasswordSubmit}
                disabled={currentPassword !== password || !newPassword || newPassword !== confirmPassword}
                style={{ 
                  background: 'var(--color-accent)', 
                  border: 'none', 
                  color: 'white', 
                  padding: '6px 16px', 
                  borderRadius: '6px', 
                  cursor: 'pointer', 
                  fontSize: '13px', 
                  fontWeight: 500,
                  opacity: (currentPassword !== password || !newPassword || newPassword !== confirmPassword) ? 0.5 : 1
                }}
              >
                Change
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              <div className="ubuntu-settings-list-group" style={{ marginBottom: '16px' }}>
                <div className="ubuntu-settings-list-item" style={{ padding: '8px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '2px' }}>
                    {currentPassword && <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Current Password</span>}
                    <input 
                      type={showPasswords ? "text" : "password"} 
                      placeholder="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', fontSize: '14px', outline: 'none', padding: currentPassword ? '0 0 4px 0' : '8px 0', width: '100%' }} 
                    />
                  </div>
                  <div style={{ cursor: 'pointer', padding: '4px', opacity: 0.5 }} onClick={() => setShowPasswords(!showPasswords)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {showPasswords ? (
                        <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></>
                      ) : (
                        <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></>
                      )}
                    </svg>
                  </div>
                </div>

                <div className="ubuntu-settings-list-item" style={{ padding: '8px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '2px' }}>
                    {newPassword && <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>New Password</span>}
                    <input 
                      type={showPasswords ? "text" : "password"} 
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', fontSize: '14px', outline: 'none', padding: newPassword ? '0 0 4px 0' : '8px 0', width: '100%' }} 
                    />
                  </div>
                </div>

                <div className="ubuntu-settings-list-item" style={{ padding: '8px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '2px' }}>
                    {confirmPassword && <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Confirm Password</span>}
                    <input 
                      type={showPasswords ? "text" : "password"} 
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', fontSize: '14px', outline: 'none', padding: confirmPassword ? '0 0 4px 0' : '8px 0', width: '100%' }} 
                    />
                  </div>
                </div>
              </div>
              
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', margin: 0 }}>
                Mix uppercase and lowercase and try to use a number or two.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
