import React, { useEffect } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';

interface BrowserContentProps {
  url: string;
  onNavigate: (url: string) => void;
  onLoad: (title: string) => void;
  onError: () => void;
}

const QUICK_LINKS = [
  { title: 'Google', url: 'https://www.google.com/webhp?igu=1', icon: '🔍' },
  { title: 'Wikipedia', url: 'https://en.wikipedia.org', icon: 'W' },
  { title: 'GitHub', url: 'https://github.com', icon: '🐈' },
  { title: 'Example', url: 'https://example.com', icon: '🌐' },
];

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
        <div className="browser-new-tab-logo">Firefox Ubuntu</div>
        <div className="browser-new-tab-search">
          <input 
            type="text" 
            className="browser-new-tab-search-input" 
            placeholder="Search the web or enter URL" 
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
        <div className="browser-quick-links">
          {QUICK_LINKS.map(link => (
            <div key={link.url} className="browser-quick-link" onClick={() => onNavigate(link.url)}>
              <div className="browser-quick-link-icon">{link.icon}</div>
              <div className="browser-quick-link-title">{link.title}</div>
            </div>
          ))}
        </div>
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
