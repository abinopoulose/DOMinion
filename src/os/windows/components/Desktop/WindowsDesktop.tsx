import { useState } from 'react';
import { useHardwareStore } from '../../../../hardware/store/useHardwareStore';
import { useWindowsAuthStore } from '../../store/useWindowsAuthStore';
import './WindowsDesktop.css';

export function WindowsDesktop() {
  const [startOpen, setStartOpen] = useState(false);
  const logout = useWindowsAuthStore((s) => s.logout);
  const enterGRUB = useHardwareStore((s) => s.enterGRUB);

  const handleDesktopClick = () => {
    if (startOpen) setStartOpen(false);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="windows-desktop-container" onClick={handleDesktopClick}>
      
      {/* Desktop Area */}
      <div className="windows-desktop-area">
        <div className="windows-desktop-icon">
          <div className="windows-icon-img recycle-bin"></div>
          <span>Recycle Bin</span>
        </div>
        <div className="windows-desktop-icon">
          <div className="windows-icon-img edge"></div>
          <span>Microsoft Edge</span>
        </div>
      </div>

      {/* Start Menu */}
      {startOpen && (
        <div className="windows-start-menu" onClick={(e) => e.stopPropagation()}>
          <div className="windows-start-pinned">
            <h3>Pinned</h3>
            <div className="windows-start-grid">
              <div className="windows-app-icon edge-app">Edge</div>
              <div className="windows-app-icon word-app">Word</div>
              <div className="windows-app-icon excel-app">Excel</div>
              <div className="windows-app-icon settings-app">Settings</div>
            </div>
          </div>
          
          <div className="windows-start-bottom">
            <div className="windows-user-profile">
              <div className="windows-user-avatar"></div>
              <span>Abino Poulose</span>
            </div>
            <div className="windows-power-options">
              <button onClick={handleLogout}>Lock</button>
              <button onClick={handleLogout}>Sign out</button>
              <button onClick={enterGRUB}>Restart</button>
            </div>
          </div>
        </div>
      )}

      {/* Taskbar */}
      <div className="windows-taskbar" onClick={(e) => e.stopPropagation()}>
        <div className="windows-taskbar-center">
          <button 
            className={`windows-start-btn ${startOpen ? 'active' : ''}`}
            onClick={() => setStartOpen(!startOpen)}
          >
            <svg viewBox="0 0 88 88" width="24" height="24">
              <path fill="#00a4ef" d="M0 12.402l35.687-4.86.016 34.253-35.67.204L0 12.402zm35.67 33.529l.028 34.053-35.67-4.904-.03-29.284 35.672.135zm4.226-39.02l47.61-6.91v40.54l-47.61.345V6.911zm47.61 41.11v40.013l-47.61-6.843V48.156l47.61-.135z" />
            </svg>
          </button>
          <div className="windows-taskbar-icon search-icon"></div>
          <div className="windows-taskbar-icon edge-icon"></div>
          <div className="windows-taskbar-icon folder-icon"></div>
        </div>
        
        <div className="windows-taskbar-right">
          <div className="windows-tray-icon network-icon"></div>
          <div className="windows-tray-icon volume-icon"></div>
          <div className="windows-taskbar-time">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            <br/>
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
