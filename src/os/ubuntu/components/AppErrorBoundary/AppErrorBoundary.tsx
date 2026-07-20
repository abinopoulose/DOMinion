import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useWindowStore } from '../../store';

interface Props {
  windowId: string;
  appId: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  detailsOpen: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, detailsOpen: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error(`[AppErrorBoundary] Crash in app '${this.props.appId}':`, error, errorInfo);
    // Future telemetry hook can go here
  }

  handleClose = () => {
    useWindowStore.getState().closeWindow(this.props.windowId);
  };

  handleRelaunch = () => {
    // Purge corrupted app state to prevent death loops
    useWindowStore.getState().updateAppState(this.props.windowId, undefined);
    
    // Remount the app by clearing the error state
    this.setState({ hasError: false, error: null, errorInfo: null, detailsOpen: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-bg-window, #fafafa)',
          color: 'var(--color-text-primary, #333)',
          fontFamily: 'Ubuntu, sans-serif',
          padding: '24px',
          boxSizing: 'border-box',
          overflow: 'auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <svg viewBox="0 0 24 24" width="48" height="48" fill="#e95420">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold' }}>
                System Program Problem Detected
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary, #666)' }}>
                The application "{this.props.appId}" has closed unexpectedly.
              </p>
            </div>
          </div>

          <div style={{
            width: '100%',
            maxWidth: '600px',
            marginBottom: '24px',
            border: '1px solid var(--color-border, #ccc)',
            borderRadius: '4px',
            backgroundColor: 'var(--color-bg-element, #fff)'
          }}>
            <button
              onClick={() => this.setState(s => ({ detailsOpen: !s.detailsOpen }))}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: 'bold',
                color: 'var(--color-text-primary, #333)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>Technical Details</span>
              <svg 
                viewBox="0 0 24 24" 
                width="16" 
                height="16" 
                fill="currentColor"
                style={{ transform: this.state.detailsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              >
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>
            
            {this.state.detailsOpen && (
              <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid var(--color-border, #ccc)' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', color: '#e95420' }}>
                  {this.state.error?.toString()}
                </div>
                <pre style={{
                  margin: 0,
                  fontSize: '11px',
                  fontFamily: 'Ubuntu Mono, monospace',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  color: 'var(--color-text-secondary, #666)',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {this.state.error?.stack}
                  {'\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={this.handleClose}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--color-border, #ccc)',
                borderRadius: '4px',
                background: 'var(--color-bg-element, #fff)',
                color: 'var(--color-text-primary, #333)',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Close Application
            </button>
            <button
              onClick={this.handleRelaunch}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                background: '#e95420',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Relaunch
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
