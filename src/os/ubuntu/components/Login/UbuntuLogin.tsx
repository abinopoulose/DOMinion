import { useState, useEffect } from 'react';
import { useUbuntuAuthStore } from '../../store/useUbuntuAuthStore';

import { UBUNTU_ACCOUNTS } from '../../../../config/accounts';
import { TopBar } from '../TopBar/TopBar';
import { SystemDialog } from '../SystemDialog/SystemDialog';
import { verifyPassword } from '../../utils/passwordHasher';
import { useUbuntuVFSStore } from '../../store';
import './UbuntuLogin.css';

export function UbuntuLogin() {
  const [isBooting, setIsBooting] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(
    UBUNTU_ACCOUNTS.length === 1 ? UBUNTU_ACCOUNTS[0].username : null
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  
  const authStore = useUbuntuAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    // Read /etc/shadow from VFS for the selected user
    const store = useUbuntuVFSStore.getState();
    const shadowNode = store.resolvePath('/etc/shadow');

    let isValid = false;

    if (shadowNode && shadowNode.type === 'file') {
      const lines = shadowNode.content.split('\n');
      const userLine = lines.find(l => l.startsWith(selectedUser + ':'));
      if (userLine) {
        const hash = userLine.split(':')[1];
        isValid = await verifyPassword(password, hash);
      }
    }

    const selectedAccount = UBUNTU_ACCOUNTS.find((u: any) => u.username === selectedUser);
    const isAutoLogin = !!selectedAccount?.autoLogin;

    if (isAutoLogin) {
      isValid = true;
    } else {
      // Fallback to config/accounts.ts if VFS shadow doesn't exist yet (migration)
      if (!isValid && !shadowNode) {
        isValid = !!(selectedAccount && selectedAccount.password === password);
      }
    }

    if (isValid) {
      authStore.login(selectedUser);
      authStore.resetAttempts(selectedUser);
    } else {
      authStore.recordFailedAttempt(selectedUser);
      if (authStore.isThrottled(selectedUser)) {
        const remainingMs = authStore.getThrottleRemainingMs(selectedUser);
        const remainingSec = Math.ceil(remainingMs / 1000);
        setError(`Account temporarily locked. Try again in ${remainingSec} seconds.`);
      } else {
        setError('Sorry, that didn’t work. Please try again.');
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (selectedUser || isBooting) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % UBUNTU_ACCOUNTS.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + UBUNTU_ACCOUNTS.length) % UBUNTU_ACCOUNTS.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const acc = UBUNTU_ACCOUNTS[highlightedIndex];
        if (acc) {
          setSelectedUser(acc.username);
          setPassword('');
          setError('');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedUser, highlightedIndex, isBooting]);

  if (isBooting) {
    return (
      <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        <svg viewBox="0 0 24 24" width="100" height="100" fill="var(--color-accent, #E95420)">
          <path d="M17.61.455a3.41 3.41 0 0 0-3.41 3.41 3.41 3.41 0 0 0 3.41 3.41 3.41 3.41 0 0 0 3.41-3.41 3.41 3.41 0 0 0-3.41-3.41zM12.92.8C8.923.777 5.137 2.941 3.148 6.451a4.5 4.5 0 0 1 .26-.007 4.92 4.92 0 0 1 2.585.737A8.316 8.316 0 0 1 12.688 3.6 4.944 4.944 0 0 1 13.723.834 11.008 11.008 0 0 0 12.92.8zm9.226 4.994a4.915 4.915 0 0 1-1.918 2.246 8.36 8.36 0 0 1-.273 8.303 4.89 4.89 0 0 1 1.632 2.54 11.156 11.156 0 0 0 .559-13.089zM3.41 7.932A3.41 3.41 0 0 0 0 11.342a3.41 3.41 0 0 0 3.41 3.409 3.41 3.41 0 0 0 3.41-3.41 3.41 3.41 0 0 0-3.41-3.41zm2.027 7.866a4.908 4.908 0 0 1-2.915.358 11.1 11.1 0 0 0 7.991 6.698 11.234 11.234 0 0 0 2.422.249 4.879 4.879 0 0 1-.999-2.85 8.484 8.484 0 0 1-.836-.136 8.304 8.304 0 0 1-5.663-4.32zm11.405.928a3.41 3.41 0 0 0-3.41 3.41 3.41 3.41 0 0 0 3.41 3.41 3.41 3.41 0 0 0 3.41-3.41 3.41 3.41 0 0 0-3.41-3.41z"/>
        </svg>
        <div style={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid transparent', borderTop: '3px solid #fff', borderRight: '3px solid #fff', borderRadius: '50%', animation: 'plymouth-spin 1s linear infinite' }}></div>
          <h1 style={{ color: 'white', fontFamily: 'Ubuntu, sans-serif', fontSize: '32px', fontWeight: 'bold', margin: 0, letterSpacing: '-1px' }}>ubuntu</h1>
        </div>
        <style>{`@keyframes plymouth-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="ubuntu-login-container">
      <TopBar isLoginScreen />
      
      <div className="ubuntu-login-box">
        {!selectedUser ? (
          <div className="ubuntu-user-list">
            {UBUNTU_ACCOUNTS.map((acc: any, index: number) => (
              <div 
                key={acc.username} 
                className={`ubuntu-user-list-item ${index === highlightedIndex ? 'focused' : ''}`}
                onClick={() => { setSelectedUser(acc.username); setPassword(''); setError(''); setHighlightedIndex(index); }}
              >
                <div className="ubuntu-user-list-avatar">
                   <svg viewBox="0 0 24 24" width="24" height="24" fill="rgba(255,255,255,0.7)"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
                <span className="ubuntu-user-list-name">{acc.displayName || acc.username}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="ubuntu-login-prompt">
            <div className="ubuntu-login-avatar">
               <svg viewBox="0 0 24 24" width="56" height="56" fill="rgba(255,255,255,0.6)"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            </div>
            <h2 className="ubuntu-login-name">{UBUNTU_ACCOUNTS.find((a: any) => a.username === selectedUser)?.displayName || selectedUser}</h2>
            
            <form onSubmit={handleLogin} className="ubuntu-login-form">
              {UBUNTU_ACCOUNTS.find((a: any) => a.username === selectedUser)?.autoLogin ? (
                <div className="ubuntu-login-input-wrapper">
                  <button type="submit" className="ubuntu-login-submit-btn" style={{ position: 'relative', width: '100%', right: 'auto', background: 'var(--color-accent)', padding: '8px 16px', borderRadius: '4px', display: 'flex', justifyContent: 'center' }}>
                    Log In
                  </button>
                </div>
              ) : (
                <div className="ubuntu-login-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="ubuntu-login-input"
                    style={{ paddingRight: password ? '70px' : '40px' }}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    autoFocus
                  />
                  {password && (
                    <>
                      <button 
                        type="button" 
                        className="ubuntu-login-eye-btn" 
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>
                        )}
                      </button>
                      <button type="submit" className="ubuntu-login-submit-btn">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
                      </button>
                    </>
                  )}
                </div>
              )}
              {error && <div className="ubuntu-login-error">{error}</div>}
            </form>
            
            {UBUNTU_ACCOUNTS.length > 1 && (
              <div className="ubuntu-login-back" onClick={() => setSelectedUser(null)}>
                Log in as another user
              </div>
            )}
          </div>
        )}
      </div>
      <SystemDialog />
    </div>
  );
}
