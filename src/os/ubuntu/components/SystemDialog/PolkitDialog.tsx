import { useState, useRef, useEffect } from 'react';
import { useSystemDialogStore } from '../../store/useSystemDialogStore';
import { useUbuntuAuthStore } from '../../store/useUbuntuAuthStore';
import { verifySudoPassword } from '../../services/sudoService';
import { UBUNTU_ACCOUNTS } from '../../../../config/accounts';

/**
 * GNOME Polkit Authentication Agent Dialog.
 *
 * Mirrors the real polkit-gnome-authentication-agent-1 behavior:
 * - Shield icon
 * - Action description
 * - User avatar & name
 * - Password field
 * - Expandable details
 * - 3 attempt limit
 * - Enter/Escape keyboard support
 */
export function PolkitDialog() {
  const { polkitRequest, closeDialog } = useSystemDialogStore();
  const currentUser = useUbuntuAuthStore((s) => s.currentUser) || 'user';

  const currentUserObj = UBUNTU_ACCOUNTS.find(a => a.username === currentUser);
  const isCurrentUserAdmin = currentUserObj?.role === 'admin' || currentUser === 'root';
  const adminUsers = UBUNTU_ACCOUNTS.filter(a => a.role === 'admin');

  // If requireAdmin is explicitly false, standard users can authenticate as themselves.
  const requireAdmin = polkitRequest?.requireAdmin !== false;
  
  const defaultAuthTarget = requireAdmin
    ? (isCurrentUserAdmin ? currentUser : (adminUsers[0]?.username || 'root'))
    : currentUser;

  const [authTargetUser, setAuthTargetUser] = useState(defaultAuthTarget);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the password input on mount
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!polkitRequest) return null;

  const handleAuthenticate = async () => {
    if (isVerifying || !password.trim()) return;
    setIsVerifying(true);

    const result = await verifySudoPassword(
      authTargetUser,
      password,
      '__polkit__',  // Special window ID for Polkit sessions
      attempts + 1
    );

    setIsVerifying(false);

    if (result.success) {
      polkitRequest.onSuccess();
      closeDialog();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPassword('');
      setError(result.error || 'Authentication failed.');

      if (newAttempts >= 3) {
        // Close after 3 failed attempts
        setTimeout(() => {
          if (polkitRequest.onCancel) polkitRequest.onCancel();
          closeDialog();
        }, 1500);
      } else {
        inputRef.current?.focus();
      }
    }
  };

  const handleCancel = () => {
    if (polkitRequest.onCancel) polkitRequest.onCancel();
    closeDialog();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAuthenticate();
    if (e.key === 'Escape') handleCancel();
  };

  // Choose icon based on request
  const iconSvg = getIconSvg(polkitRequest.icon || 'shield');

  return (
    <div className="polkit-overlay" onClick={handleCancel}>
      <div className="polkit-dialog" onClick={(e) => e.stopPropagation()}>

        {/* Icon */}
        <div className="polkit-icon">
          {iconSvg}
        </div>

        {/* Title */}
        <div className="polkit-title">Authentication Required</div>

        {/* Message */}
        <div className="polkit-message">
          {polkitRequest.message}
        </div>

        {/* User identity */}
        <div className="polkit-user-row">
          <div className="polkit-user-avatar">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <div className="polkit-user-info">
            {authTargetUser === currentUser || isCurrentUserAdmin ? (
              <div className="polkit-user-name">{authTargetUser}</div>
            ) : (
              <select
                value={authTargetUser}
                onChange={(e) => setAuthTargetUser(e.target.value)}
                className="polkit-user-name"
                style={{ 
                  background: 'transparent', 
                  color: 'inherit', 
                  border: '1px solid var(--color-border)', 
                  borderRadius: '4px', 
                  padding: '2px 4px', 
                  fontSize: '14px', 
                  outline: 'none',
                  marginBottom: '4px',
                  width: '100%'
                }}
              >
                {adminUsers.map(admin => (
                  <option key={admin.username} value={admin.username} style={{ background: 'var(--color-bg-window)', color: 'var(--color-text-primary)' }}>
                    {admin.displayName || admin.username}
                  </option>
                ))}
              </select>
            )}
            <div className="polkit-user-hint">Password:</div>
          </div>
        </div>

        {/* Password input */}
        <div className="polkit-password-container">
          <input
            ref={inputRef}
            type="password"
            className={`polkit-password-input ${error ? 'polkit-password-error' : ''}`}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="Password"
            disabled={isVerifying || attempts >= 3}
            autoComplete="off"
          />
          {error && <div className="polkit-error">{error}</div>}
        </div>

        {/* Details expander */}
        {polkitRequest.actionId && (
          <div className="polkit-details-section">
            <button
              className="polkit-details-toggle"
              onClick={() => setShowDetails(!showDetails)}
            >
              <svg
                width="12" height="12" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                style={{ transform: showDetails ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
              >
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              Details
            </button>
            {showDetails && (
              <div className="polkit-details-content">
                <div><strong>Action:</strong> {polkitRequest.actionId}</div>
                {polkitRequest.details && <div>{polkitRequest.details}</div>}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="polkit-actions">
          <button
            className="polkit-btn polkit-btn-cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className="polkit-btn polkit-btn-auth"
            onClick={handleAuthenticate}
            disabled={isVerifying || !password.trim() || attempts >= 3}
          >
            {isVerifying ? 'Authenticating...' : 'Authenticate'}
          </button>
        </div>
      </div>
    </div>
  );
}

function getIconSvg(icon: string) {
  switch (icon) {
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" width="48" height="48" fill="#E95420">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
        </svg>
      );
    case 'folder':
      return (
        <svg viewBox="0 0 24 24" width="48" height="48" fill="#E95420">
          <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" width="48" height="48" fill="#E95420">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
        </svg>
      );
  }
}
