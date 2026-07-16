import { useState } from 'react';
import { useWindowStore } from '../../store';
import { BRANDING } from '../../../../config/branding';
import './ErrorReporter.css';

interface ErrorReporterProps {
  windowId: string;
}

export function ErrorReporter({ windowId }: ErrorReporterProps) {
  const windowState = useWindowStore((s: any) => s.windows.find((w: any) => w.id === windowId));
  const closeWindow = useWindowStore((s: any) => s.closeWindow);
  const [showDetails, setShowDetails] = useState(false);
  
  const appState = windowState?.appState || {};
  const errorMessage = appState.errorMessage || 'Unknown Error';
  const errorStack = appState.errorStack || '';
  const componentStack = appState.componentStack || '';

  const handleSend = () => {
    const errorDetails = `Error: ${errorMessage}\n\nStack Trace:\n${errorStack}\n\nComponent Stack:\n${componentStack}`;
    const subject = encodeURIComponent("DOMinion Error");
    const body = encodeURIComponent(`Please describe what you were doing when this error occurred:\n\n\n--- Error Details ---\n${errorDetails}`);
    
    window.location.href = `mailto:${BRANDING.developerEmail || 'developers@dominion.os'}?subject=${subject}&body=${body}`;
  };

  const handleClose = () => {
    closeWindow(windowId);
  };

  return (
    <div className="error-reporter-container">
      <div className="error-reporter-header">
        <div className="error-reporter-icon-wrapper">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="#e5534b">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
        <div>
          <h2 className="error-reporter-title">System Error Detected</h2>
          <p className="error-reporter-subtitle">An unexpected problem has occurred in a background component.</p>
        </div>
      </div>
      
      <div className="error-reporter-body">
        <div className="error-reporter-card">
          <h3 className="error-reporter-card-title">Help us improve</h3>
          <p className="error-reporter-card-text">
            We apologize for the inconvenience. Reporting this issue helps the developers identify the root cause and release a fix in the next update. All reports are strictly confidential.
          </p>
        </div>

        <div>
          <button 
            className={`error-reporter-toggle ${showDetails ? 'expanded' : ''}`}
            onClick={() => setShowDetails(!showDetails)}
          >
            <span>Show technical details</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          
          {showDetails && (
            <div className="error-reporter-code-block">
              <pre className="error-reporter-code-text">{errorMessage}</pre>
            </div>
          )}
        </div>
      </div>

      <div className="error-reporter-footer">
        <button className="error-reporter-btn error-reporter-btn-secondary" onClick={handleClose}>
          Ignore
        </button>
        <button className="error-reporter-btn error-reporter-btn-primary" onClick={handleSend}>
          Report Issue
        </button>
      </div>
    </div>
  );
}
