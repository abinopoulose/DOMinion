import React from 'react';

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
