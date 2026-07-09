import React, { useEffect } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';

interface BrowserContentProps {
  url: string;
  onNavigate: (url: string) => void;
  onLoad: (title: string) => void;
  onError: () => void;
}


export function BrowserContent({ url, onNavigate, onLoad, onError }: BrowserContentProps) {
  const { wifiEnabled } = useNetworkStore();

  useEffect(() => {
    if (!wifiEnabled && url) {
      onLoad('Offline');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wifiEnabled, url]);

  if (!wifiEnabled && url) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        backgroundColor: '#ffffff', 
        color: '#202124', 
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        display: 'flex',
        paddingTop: '10%'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <svg viewBox="0 0 24 24" width="48" height="48" fill="#5f6368" style={{ marginBottom: '24px' }}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          
          <h1 style={{ margin: '0 0 12px 0', fontSize: '28px', fontWeight: '400', letterSpacing: '-0.5px' }}>
            No internet
          </h1>
          
          <div style={{ fontSize: '15px', color: '#5f6368', lineHeight: '1.6' }}>
            <p style={{ margin: '0 0 12px 0' }}>Try:</p>
            <ul style={{ margin: '0 0 24px 0', paddingLeft: '24px' }}>
              <li style={{ paddingBottom: '4px' }}>Checking the network cables, modem, and router</li>
              <li style={{ paddingBottom: '4px' }}>Reconnecting to Wi-Fi</li>
              <li>Turning off Airplane Mode</li>
            </ul>
          </div>
          
          <div style={{ fontSize: '13px', color: '#70757a', letterSpacing: '0.3px', fontFamily: 'monospace' }}>
            ERR_INTERNET_DISCONNECTED
          </div>
        </div>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="browser-new-tab-page">
        <div className="browser-new-tab-logo">
          <img src="/ubuntu/icons/browser.svg" alt="Firefox" style={{ width: '80px', height: '80px', marginRight: '16px' }} />
          <span style={{ fontSize: '48px', fontWeight: '500', color: '#20123a', letterSpacing: '-1px' }}>Firefox</span>
        </div>
        <div className="browser-new-tab-search">
          <svg style={{ marginRight: '12px', flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <input 
            type="text" 
            className="browser-new-tab-search-input" 
            placeholder="Search with Google or enter address" 
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = e.currentTarget.value.trim();
                if (val) {
                  onNavigate(val.includes('.') && !val.includes(' ') ? (val.startsWith('http') ? val : `https://${val}`) : `https://www.google.com/search?q=${encodeURIComponent(val)}&igu=1`);
                }
              }
            }}
          />
        </div>
        <button className="browser-new-tab-settings-btn" title="Personalize New Tab">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 10.19l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </button>
      </div>
    );
  }

  // Handle load event to attempt title extraction (often blocked by CORS but we try)
  const handleLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    try {
      const iframe = e.target as HTMLIFrameElement;
      // Cross-origin will throw DOMException here
      const title = iframe.contentDocument?.title;
      if (title) onLoad(title);
      else {
        // Fallback to URL host
        const urlObj = new URL(url);
        onLoad(urlObj.hostname);
      }
    } catch (err) {
      // CORS prevented access
      try {
        const urlObj = new URL(url);
        onLoad(urlObj.hostname);
      } catch (e) {
        onLoad(url);
      }
    }
  };

  const handleError = () => {
    onError();
  };

  return (
    <div className="browser-content-container">
      <iframe
        src={url}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        referrerPolicy="no-referrer"
        className="browser-iframe"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}
