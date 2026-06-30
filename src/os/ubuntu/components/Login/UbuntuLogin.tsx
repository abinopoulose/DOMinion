import { useState, useEffect } from 'react';
import { useUbuntuAuthStore } from '../../store/useUbuntuAuthStore';
import { useHardwareStore } from '../../../../hardware/store/useHardwareStore';
import { UBUNTU_ACCOUNTS } from '../../../../config/accounts';
import { TopBar } from '../TopBar/TopBar';
import './UbuntuLogin.css';

export function UbuntuLogin() {
  const [isBooting, setIsBooting] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(
    UBUNTU_ACCOUNTS.length === 1 ? UBUNTU_ACCOUNTS[0].username : null
  );
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const login = useUbuntuAuthStore((s) => s.login);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const account = UBUNTU_ACCOUNTS.find(a => a.username === selectedUser);
    if (account && account.password === password) {
      login(selectedUser!);
    } else {
      setError('Sorry, that didn’t work. Please try again.');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isBooting) {
    return (
      <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ color: 'white', fontFamily: 'Ubuntu, sans-serif', fontSize: '56px', fontWeight: 'bold', margin: 0, letterSpacing: '-1px' }}>ubuntu</h1>
        <div style={{ marginTop: '50px', width: '36px', height: '36px', border: '3px solid rgba(255,255,255,0.2)', borderTop: '3px solid #E95420', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="ubuntu-login-container">
      <TopBar isLoginScreen />
      
      <div className="ubuntu-login-box">
        {!selectedUser ? (
          <div className="ubuntu-user-list">
            {UBUNTU_ACCOUNTS.map(acc => (
              <div 
                key={acc.username} 
                className="ubuntu-user-list-item"
                onClick={() => { setSelectedUser(acc.username); setPassword(''); setError(''); }}
              >
                <div className="ubuntu-user-list-avatar">
                   <svg viewBox="0 0 24 24" width="24" height="24" fill="rgba(255,255,255,0.7)"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
                <span className="ubuntu-user-list-name">{acc.username}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="ubuntu-login-prompt">
            <div className="ubuntu-login-avatar">
               <svg viewBox="0 0 24 24" width="64" height="64" fill="rgba(255,255,255,0.6)"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            </div>
            <h2 className="ubuntu-login-name">{selectedUser}</h2>
            
            <form onSubmit={handleLogin} className="ubuntu-login-form">
              <div className="ubuntu-login-input-wrapper">
                <input
                  type="password"
                  className="ubuntu-login-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  autoFocus
                />
              </div>
              {error && <div className="ubuntu-login-error">{error}</div>}
            </form>
            
            <div className="ubuntu-login-actions">
              {UBUNTU_ACCOUNTS.length > 1 && (
                <button className="ubuntu-login-cancel" onClick={() => setSelectedUser(null)}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
