import { useState, useEffect } from 'react';
import { useWindowsAuthStore } from '../../store/useWindowsAuthStore';
import { useHardwareStore } from '../../../../hardware/store/useHardwareStore';
import { WINDOWS_ACCOUNTS } from '../../../../config/accounts';
import './WindowsLogin.css';

export function WindowsLogin() {
  const [isBooting, setIsBooting] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const login = useWindowsAuthStore((s) => s.login);
  const enterGRUB = useHardwareStore((s) => s.enterGRUB);
  
  const account = WINDOWS_ACCOUNTS[0];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (account.password === password) {
      login(account.username);
    } else {
      setError('The password you entered is incorrect. Please try again.');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (isBooting) {
    return (
      <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', width: '80px', height: '80px', marginBottom: '80px' }}>
          <div style={{ backgroundColor: '#00A4EF' }}></div>
          <div style={{ backgroundColor: '#00A4EF' }}></div>
          <div style={{ backgroundColor: '#00A4EF' }}></div>
          <div style={{ backgroundColor: '#00A4EF' }}></div>
        </div>
        <div style={{ width: '30px', height: '30px', border: '4px dotted white', borderRadius: '50%', animation: 'spin 2s linear infinite' }}></div>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="windows-login-container">
      <div className="windows-login-box">
        <div className="windows-login-avatar">
          <div className="windows-avatar-icon"></div>
        </div>
        <h2 className="windows-login-name">{account.displayName}</h2>
        <div className="windows-login-email">{account.username}</div>
        
        <form onSubmit={handleLogin} className="windows-login-form">
          <input
            type="password"
            className="windows-login-input"
            placeholder="PIN"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            autoFocus
          />
          <button type="submit" className="windows-login-submit">→</button>
        </form>
        {error && <div className="windows-login-error">{error}</div>}
        <div className="windows-login-options">
          <span>Sign-in options</span>
        </div>
      </div>
      
      <div className="windows-login-bottom">
        <div className="windows-power-btn" onClick={enterGRUB}>
          ⏻
        </div>
      </div>
    </div>
  );
}
