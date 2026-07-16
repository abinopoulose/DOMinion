import { useEffect } from 'react';
import { useNotificationStore } from './useNotificationStore';
import './NotificationPopup.css';

export function NotificationPopup() {
  const { activePopup, dismissPopup } = useNotificationStore();

  useEffect(() => {
    if (activePopup) {
      if (activePopup.progress !== undefined) return; // Don't auto-dismiss progress notifications
      
      const timer = setTimeout(() => {
        dismissPopup();
      }, 5000); // Auto-dismiss after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [activePopup?.id, activePopup?.progress, dismissPopup]);

  if (!activePopup) return null;

  return (
    <div className="notification-popup">
      <div className="notification-popup__content">
        {activePopup.icon && <span className="notification-popup__icon">{activePopup.icon}</span>}
        <div className="notification-popup__text">
          <h4>{activePopup.title}</h4>
          <p>{activePopup.message}</p>
          {activePopup.progress !== undefined && (
            <div className="notification-popup__progress-container">
              <div className="notification-popup__progress-header">
                <span className="notification-popup__progress-text">{activePopup.progress}%</span>
              </div>
              <div className="notification-popup__progress">
                <div className="notification-popup__progress-bar" style={{ width: `${activePopup.progress}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>
      <button className="notification-popup__close" onClick={dismissPopup}>
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
