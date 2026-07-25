import React from 'react';

export interface Bookmark {
  url: string;
  title: string;
}

interface BrowserModalsProps {
  activeModal: 'bookmarks' | 'history' | 'settings' | null;
  onClose: () => void;
  bookmarks: Bookmark[];
  history: string[];
  onNavigate: (url: string) => void;
  onRemoveBookmark: (url: string) => void;
}

export function BrowserModals({
  activeModal,
  onClose,
  bookmarks,
  history,
  onNavigate,
  onRemoveBookmark,
}: BrowserModalsProps) {
  if (!activeModal) return null;

  return (
    <div className="browser-modal-overlay" onClick={onClose} style={{
      position: 'absolute', top: '70px', right: '10px',
      background: 'var(--color-bg-primary)',
      border: '1px solid var(--color-border)',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      width: '320px',
      maxHeight: '400px',
      overflowY: 'auto',
      zIndex: 100,
      padding: '12px'
    }}>
      <div onClick={(e) => e.stopPropagation()}>
        {activeModal === 'bookmarks' && (
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Bookmarks</h3>
            {bookmarks.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>No bookmarks yet. Click the star icon to add one.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {bookmarks.map((bm, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '13px' }}>
                    <div 
                      style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer', color: 'var(--color-accent)' }}
                      onClick={() => { onNavigate(bm.url); onClose(); }}
                      title={bm.url}
                    >
                      {bm.title || bm.url}
                    </div>
                    <button 
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                      onClick={() => onRemoveBookmark(bm.url)}
                      title="Remove Bookmark"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        
        {activeModal === 'history' && (
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>History</h3>
            {history.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>No browsing history yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {Array.from(new Set(history)).reverse().map((url, i) => (
                  <li key={i} style={{ marginBottom: '8px', fontSize: '13px' }}>
                    <div 
                      style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer', color: 'var(--color-accent)' }}
                      onClick={() => { onNavigate(url); onClose(); }}
                      title={url}
                    >
                      {url}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeModal === 'settings' && (
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Browser Settings</h3>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              <strong>Search Engine:</strong> Google (Default)
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              <strong>Homepage:</strong> Start Page
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              <em>More settings coming soon in future updates.</em>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
