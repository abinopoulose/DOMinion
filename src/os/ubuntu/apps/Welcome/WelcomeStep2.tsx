import React, { useEffect, useRef } from 'react';
import { downloadRemainingFiles } from '../../utils/downloadRemainingFiles';

interface WelcomeStep2Props {
  onBack: () => void;
  onNext: () => void;
  downloadProgress: number;
  setDownloadProgress: (p: number) => void;
  logs: string[];
  setLogs: React.Dispatch<React.SetStateAction<string[]>>;
  isPausedRef: React.MutableRefObject<boolean>;
  isPaused: boolean;
  setIsPaused: (p: boolean) => void;
  showTerminal: boolean;
  setShowTerminal: (s: boolean) => void;
}

export function WelcomeStep2({ 
  onNext, onBack, 
  downloadProgress, setDownloadProgress,
  logs, setLogs,
  isPausedRef, isPaused, setIsPaused,
  showTerminal, setShowTerminal
}: WelcomeStep2Props) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const handleDownload = async () => {
    if (downloadProgress >= 0) return;
    setDownloadProgress(0);
    setShowTerminal(true);
    setLogs([
      'Reading package lists... Done',
      'Building dependency tree... Done',
      'Reading state information... Done',
      'The following NEW packages will be installed:',
      '  ubuntu-web-assets ubuntu-wallpapers fonts-ubuntu',
      '0 upgraded, 3 newly installed, 0 to remove.',
      'Need to get 14.2 MB of archives.',
      'After this operation, 45.1 MB of additional disk space will be used.'
    ]);
    
    await downloadRemainingFiles(setDownloadProgress, (msg) => {
      setLogs(prev => [...prev, msg]);
    }, isPausedRef);
    
    setLogs(prev => [
      ...prev,
      'Fetched 14.2 MB in 2s (7,100 kB/s)',
      'Selecting previously unselected package ubuntu-web-assets.',
      'Preparing to unpack .../ubuntu-web-assets_24.04.deb ...',
      'Unpacking ubuntu-web-assets (24.04) ...',
      'Setting up ubuntu-web-assets (24.04) ...',
      'Processing triggers for fontconfig (2.13.1-4.2ubuntu5) ...',
      'Done.'
    ]);
    
    setTimeout(() => {
      onNext();
    }, 1500);
  };

  const togglePause = () => {
    isPausedRef.current = !isPausedRef.current;
    setIsPaused(isPausedRef.current);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Top Bar */}
      <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#1a1a1a', background: '#ffffff', flexShrink: 0 }}>
        Ubuntu 24.04 LTS
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {downloadProgress < 0 || !showTerminal ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '26px', margin: '0 0 16px 0', fontWeight: 400, color: '#1a1a1a' }}>System Assets</h2>
            <p style={{ fontSize: '16px', color: '#555', maxWidth: '480px', lineHeight: 1.5 }}>
              For a seamless offline experience, we recommend downloading all system files, icons, and wallpapers now.
            </p>
          </div>
        ) : (
          <div 
            ref={terminalRef}
            className="welcome-terminal"
            style={{
              flex: 1,
              minHeight: 0,
              background: '#000000',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: '#ffffff',
              overflowY: 'auto',
              padding: '16px',
              lineHeight: 1.4,
              wordBreak: 'break-all'
            }}
          >
            {logs.length === 0 && <div style={{ opacity: 0.5 }}>Waiting to start apt-get...</div>}
            {logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      {downloadProgress < 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', background: '#ffffff', flexShrink: 0, justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', boxShadow: '0 -4px 20px rgba(0,0,0,0.03)', position: 'relative', zIndex: 20 }}>
          <button onClick={onBack} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#555', padding: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button
              onClick={handleDownload}
              style={{
                padding: '8px 24px',
                borderRadius: '6px',
                border: 'none',
                background: '#e95420',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                boxShadow: '0 2px 6px rgba(233, 84, 32, 0.25)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              Download
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', background: '#ffffff', flexShrink: 0, borderTop: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 -8px 24px rgba(0,0,0,0.1)', gap: '24px', position: 'relative', zIndex: 20 }}>
          <div style={{ display: 'flex', gap: '16px', color: '#555', alignItems: 'center' }}>
            <button onClick={onBack} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button onClick={togglePause} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}>
              {isPaused ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
              )}
            </button>
            <button disabled style={{ background: 'transparent', border: 'none', color: '#ccc', padding: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '13px', color: '#333' }}>
              {isPaused ? 'Paused...' : 'Setting up the system...'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, height: '4px', background: '#f0f0f0', borderRadius: '2px', overflow: 'hidden', display: 'flex', position: 'relative' }}>
                <div style={{ width: `${downloadProgress}%`, background: '#e95420', transition: 'width 0.2s' }} />
                {!isPaused && downloadProgress > 0 && downloadProgress < 100 && (
                  <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '20%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)', animation: 'welcome-progress-slide 1.5s infinite linear' }} />
                )}
              </div>
              <button onClick={() => setShowTerminal(!showTerminal)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: showTerminal ? '#e95420' : '#555' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
