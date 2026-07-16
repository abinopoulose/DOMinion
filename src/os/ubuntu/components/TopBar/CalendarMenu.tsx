import { useState } from 'react';
import { useWindowStore } from '../../store/useUbuntuWindowStore';
import { useNotificationStore } from '../Notifications/useNotificationStore';
import './CalendarMenu.css';

export function CalendarMenu({ onClose }: { onClose: () => void }) {
  const [date, setDate] = useState(new Date());
  const openWindow = useWindowStore((s) => s.openWindow);
  const { notifications, removeNotification, clearAll, dndEnabled, setDndEnabled } = useNotificationStore();

  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const prevMonthDays = new Date(date.getFullYear(), date.getMonth(), 0).getDate();

  const days = [];
  // Previous month padding
  for (let i = 0; i < firstDay; i++) {
    days.push({ day: prevMonthDays - firstDay + i + 1, dim: true, active: false });
  }
  // Current month
  const today = new Date();
  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = today.getDate() === i && today.getMonth() === date.getMonth() && today.getFullYear() === date.getFullYear();
    days.push({ day: i, active: isToday, dim: false });
  }
  // Next month padding
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, dim: true, active: false });
  }

  const prevMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1));
  const nextMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1));

  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(today);
  const dateString = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(today);
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);

  const handleOpenWorldClocks = () => {
    openWindow('clock');
    onClose();
  };

  return (
    <div className="calendar-menu" onClick={(e) => e.stopPropagation()}>
      <div className="calendar-menu__left">
        <div className={`calendar-menu__notifications ${notifications.length > 0 ? 'has-notifications' : 'empty'}`}>
          {notifications.length === 0 ? (
            <>
              <svg viewBox="0 0 24 24" fill="currentColor" className="calendar-menu__notifications-icon">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
              </svg>
              <p>No Notifications</p>
            </>
          ) : (
            <div className="calendar-menu__notifications-list">
              {notifications.map(notif => (
                <div key={notif.id} className="notification-card">
                  <div className="notification-card__header">
                    <div className="notification-card__title">
                      {notif.icon && <span>{notif.icon}</span>}
                      <span>{notif.title || 'Clocks'}</span>
                      <span className="notification-card__time">Just now</span>
                    </div>
                    <button className="notification-card__close" onClick={() => removeNotification(notif.id)}>
                      <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <div className="notification-card__body">
                    {notif.message === 'Time is up! Your timer has finished.' ? (
                       <>
                         <h4>Time is up!</h4>
                         <p>Timer countdown finished</p>
                       </>
                    ) : (
                       <>
                         <h4>{notif.message.split('\n')[0] || notif.message}</h4>
                         {notif.message.split('\n').length > 1 && (
                           <p>{notif.message.split('\n').slice(1).join(' ')}</p>
                         )}
                         {notif.progress !== undefined && (
                           <div className="notification-card__progress-container">
                             <div className="notification-card__progress-header">
                               <span className="notification-card__progress-text">{notif.progress}%</span>
                             </div>
                             <div className="notification-card__progress">
                               <div className="notification-card__progress-bar" style={{ width: `${notif.progress}%` }} />
                             </div>
                           </div>
                         )}
                       </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="calendar-menu__footer">
          <button 
            className={`calendar-menu__dnd-btn ${dndEnabled ? 'active' : ''}`} 
            onClick={() => setDndEnabled(!dndEnabled)}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
            <span>Do Not Disturb</span>
          </button>
          {notifications.length > 0 && (
            <button className="calendar-menu__clear-btn" onClick={clearAll}>Clear</button>
          )}
        </div>
      </div>

      <div className="calendar-menu__right">
        <div className="calendar-menu__header">
          <h3>{dayName}</h3>
          <h2>{dateString}</h2>
        </div>

        <div className="calendar-widget">
          <div className="calendar-widget__nav">
            <button onClick={prevMonth}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            <span>{monthName}</span>
            <button onClick={nextMonth}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </button>
          </div>
          <div className="calendar-widget__grid">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={`day-name-${i}`} className="calendar-widget__day-name">{d}</div>
            ))}
            {days.map((d, i) => (
              <div key={`day-${i}`} className={`calendar-widget__day ${d.active ? 'active' : ''} ${d.dim ? 'dim' : ''}`}>
                {d.day}
              </div>
            ))}
          </div>
        </div>


        <div className="calendar-menu__world-clocks" onClick={handleOpenWorldClocks}>
          Add world clocks...
        </div>
      </div>
    </div>
  );
}
