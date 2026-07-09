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
          <svg viewBox="0 0 100 100" className="windows-avatar-svg">
            <circle cx="50" cy="38" r="18" stroke="#777" strokeWidth="5" fill="none" />
            <path d="M 18 90 Q 50 50 82 90" stroke="#777" strokeWidth="5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="windows-login-name">{account.displayName}</h2>
        
        <form onSubmit={handleLogin} className="windows-login-form">
          <input
            type="password"
            className="windows-login-input"
            placeholder="PIN"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            autoFocus
          />
          <button type="submit" className="windows-login-submit">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>
        {error && <div className="windows-login-error">{error}</div>}
        
        <div className="windows-login-links">
          <div className="windows-login-link">I forgot my PIN</div>
          <div className="windows-login-link">Sign-in options</div>
        </div>
      </div>
      
      <div className="windows-login-users">
        {WINDOWS_ACCOUNTS.map((acc, index) => (
          <div className={`windows-user-item ${index === 0 ? 'active' : ''}`} key={acc.username}>
            <div className="windows-user-item-avatar">
              <svg viewBox="0 0 100 100" className="windows-avatar-svg-small">
                <circle cx="50" cy="38" r="18" stroke="#555" strokeWidth="6" fill="none" />
                <path d="M 18 90 Q 50 50 82 90" stroke="#555" strokeWidth="6" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <div className="windows-user-item-name">{acc.displayName}</div>
          </div>
        ))}
        {WINDOWS_ACCOUNTS.length === 1 && (
          <div className="windows-user-item">
            <div className="windows-user-item-avatar">
              <svg viewBox="0 0 100 100" className="windows-avatar-svg-small">
                <circle cx="50" cy="38" r="18" stroke="#555" strokeWidth="6" fill="none" />
                <path d="M 18 90 Q 50 50 82 90" stroke="#555" strokeWidth="6" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <div className="windows-user-item-name">Other user</div>
          </div>
        )}
      </div>

      <div className="windows-login-bottom">
        <div className="windows-bottom-btn" title="Network">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 21C14.2091 21 16 16.9706 16 12C16 7.02944 14.2091 3 12 3C9.79086 3 8 7.02944 8 12C8 16.9706 9.79086 21 12 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 12H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="windows-bottom-btn" title="Accessibility">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 14C15.3137 14 18 11.3137 18 8C18 4.68629 15.3137 2 12 2C8.68629 2 6 4.68629 6 8C6 11.3137 8.68629 14 12 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 14V22M12 22L9 19M12 22L15 19M5 11H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="windows-bottom-btn" onClick={enterGRUB} title="Power">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2V12M18.36 5.64C19.6195 6.89974 20.5195 8.50284 20.9575 10.2644C21.3956 12.026 21.3533 13.8749 20.8351 15.6025C20.3168 17.3302 19.3435 18.8675 18.0287 20.0384C16.714 21.2093 15.1114 21.9654 13.4079 22.2198C11.7045 22.4741 9.9723 22.2163 8.41506 21.4776C6.85782 20.7388 5.53982 19.5494 4.6133 18.0504C3.68677 16.5513 3.19069 14.8037 3.18182 13.0076C3.17294 11.2115 3.65171 9.44 4.56 7.92" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
