import React, { Component, type ErrorInfo } from 'react';
import './UbuntuErrorBoundary.css';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class UbuntuErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("Ubuntu Crash Detected:", error, errorInfo);
    
    // Spawn actual OS window instead of a portal/popup
    import('../../store/useUbuntuWindowStore').then(({ useWindowStore }) => {
      useWindowStore.getState().openWindow('error-reporter', {
        errorMessage: error.message,
        errorStack: error.stack,
        componentStack: errorInfo.componentStack
      });
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', flexDirection: 'column', gap: '16px', background: 'var(--bg-window)' }}>
          <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" style={{ opacity: 0.3 }}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <span style={{ fontSize: '14px' }}>This application has closed unexpectedly.</span>
        </div>
      );
    }

    return this.props.children;
  }
}
