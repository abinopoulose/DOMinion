import { useState, useEffect } from 'react';
import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';

export function PrintersPanel() {
  const [showDialog, setShowDialog] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let timeoutId: number;
    if (showDialog && isSearching) {
      timeoutId = window.setTimeout(() => {
        setIsSearching(false);
      }, 5000);
    }
    return () => clearTimeout(timeoutId);
  }, [showDialog, isSearching]);

  const openDialog = () => {
    setIsSearching(true);
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setIsSearching(false);
  };

  const printerIcon = (
    <svg 
      width="160" 
      height="160" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );

  return (
    <SettingsPanelWrapper>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', marginTop: '64px' }}>
        <div style={{ opacity: 0.5, marginBottom: '24px' }}>
          {printerIcon}
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 24px 0', color: 'var(--color-text-primary)' }}>
          No Printers
        </h2>
        <button 
          onClick={openDialog}
          style={{ 
            background: 'var(--color-accent, #E95420)', 
            color: 'white', 
            border: 'none', 
            padding: '10px 24px', 
            borderRadius: '24px', 
            fontSize: '14px', 
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          Add Printer...
        </button>
      </div>

      {showDialog && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            width: '540px',
            height: '460px',
            backgroundColor: 'var(--bg-window, #ffffff)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            {/* Dialog Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid rgba(0,0,0,0.1)',
              backgroundColor: 'var(--bg-titlebar, #f0f0f0)'
            }}>
              <button 
                onClick={closeDialog}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid rgba(0,0,0,0.15)',
                  background: 'var(--bg-window, #ffffff)',
                  color: 'var(--color-text-primary)',
                  fontWeight: 500,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>Add Printer</span>
                {isSearching && (
                  <span style={{ fontSize: '11px', opacity: 0.6, color: 'var(--color-text-secondary)', marginTop: '-2px' }}>
                    Searching For Printers...
                  </span>
                )}
              </div>
              
              <button 
                disabled
                style={{
                  padding: '6px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--color-accent, #E95420)',
                  color: 'white',
                  fontWeight: 500,
                  fontSize: '13px',
                  opacity: 0.5,
                  cursor: 'not-allowed'
                }}
              >
                Add
              </button>
            </div>

            {/* Dialog Body */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isSearching ? (
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid rgba(0,0,0,0.1)',
                  borderTopColor: 'var(--color-text-primary)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  opacity: 0.5
                }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '-40px' }}>
                  <div style={{ opacity: 0.4, marginBottom: '24px' }}>
                    {printerIcon}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                    No Printers Found
                  </h3>
                </div>
              )}

              {/* Search Input */}
              <div style={{
                position: 'absolute',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '85%'
              }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <svg 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Enter a network address or search for a printer" 
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 34px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-accent, #E95420)',
                      outline: 'none',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      backgroundColor: 'transparent',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </SettingsPanelWrapper>
  );
}
