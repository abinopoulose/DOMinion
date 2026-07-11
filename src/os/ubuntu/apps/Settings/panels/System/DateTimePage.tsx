import { useState, useEffect } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';

export function DateTimePage() {
  const {
    clockTimeFormat,
    clockShowWeekday,
    clockShowDate,
    clockShowSeconds,
    clockShowWeekNumbers,
    setClockTimeFormat,
    setClockShowWeekday,
    setClockShowDate,
    setClockShowSeconds,
    setClockShowWeekNumbers
  } = useSettingsStore();

  const [autoTime, setAutoTime] = useState(true);
  const [autoTimeZone, setAutoTimeZone] = useState(false);
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setTimeStr(new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: clockTimeFormat === 'AM / PM' }).format(new Date()));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [clockTimeFormat]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '640px', margin: '0 auto', gap: '24px', paddingBottom: '32px' }}>
      <div className="ubuntu-settings-list-group">
        <div className="ubuntu-settings-list-item clickable" onClick={() => setAutoTime(!autoTime)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span>Automatic Date & Time</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Requires internet access</span>
          </div>
          <div className={`ubuntu-settings-toggle ${autoTime ? 'checked' : ''}`}>
            <div className="ubuntu-settings-toggle-knob" />
          </div>
        </div>
        <div className="ubuntu-settings-list-item interactive">
          <span>Date & Time</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>{timeStr}</span>
            <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </div>

      <div className="ubuntu-settings-list-group">
        <div className="ubuntu-settings-list-item clickable" onClick={() => setAutoTimeZone(!autoTimeZone)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span>Automatic Time Zone</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Requires location services enabled and internet access</span>
          </div>
          <div className={`ubuntu-settings-toggle ${autoTimeZone ? 'checked' : ''}`}>
            <div className="ubuntu-settings-toggle-knob" />
          </div>
        </div>
        <div className="ubuntu-settings-list-item interactive">
          <span>Time Zone</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>IST (Kolkata, India)</span>
            <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </div>

      <div className="ubuntu-settings-list-group">
        <div className="ubuntu-settings-list-item">
          <span>Time Format</span>
          <div style={{ display: 'flex', background: 'var(--color-surface-hover)', borderRadius: '6px', padding: '2px' }}>
            <button 
              onClick={() => setClockTimeFormat('24-hour')} 
              style={{ padding: '6px 16px', background: clockTimeFormat === '24-hour' ? 'var(--color-border)' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'var(--color-text-primary)', fontSize: '13px', fontWeight: 500, transition: 'background 0.2s' }}
            >
              24-hour
            </button>
            <button 
              onClick={() => setClockTimeFormat('AM / PM')} 
              style={{ padding: '6px 16px', background: clockTimeFormat === 'AM / PM' ? 'var(--color-border)' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'var(--color-text-primary)', fontSize: '13px', fontWeight: 500, transition: 'background 0.2s' }}
            >
              AM / PM
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 12px' }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Clock & Calendar</h3>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>Control how the time and date is shown in the top bar</p>
      </div>

      <div className="ubuntu-settings-list-group">
        <div className="ubuntu-settings-list-item clickable" onClick={() => setClockShowWeekday(!clockShowWeekday)}>
          <span>Week Day</span>
          <div className={`ubuntu-settings-toggle ${clockShowWeekday ? 'checked' : ''}`}>
            <div className="ubuntu-settings-toggle-knob" />
          </div>
        </div>
        <div className="ubuntu-settings-list-item clickable" onClick={() => setClockShowDate(!clockShowDate)}>
          <span>Date</span>
          <div className={`ubuntu-settings-toggle ${clockShowDate ? 'checked' : ''}`}>
            <div className="ubuntu-settings-toggle-knob" />
          </div>
        </div>
        <div className="ubuntu-settings-list-item clickable" onClick={() => setClockShowSeconds(!clockShowSeconds)}>
          <span>Seconds</span>
          <div className={`ubuntu-settings-toggle ${clockShowSeconds ? 'checked' : ''}`}>
            <div className="ubuntu-settings-toggle-knob" />
          </div>
        </div>
        <div className="ubuntu-settings-list-item clickable" onClick={() => setClockShowWeekNumbers(!clockShowWeekNumbers)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span>Week Numbers</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Shown in the dropdown calendar</span>
          </div>
          <div className={`ubuntu-settings-toggle ${clockShowWeekNumbers ? 'checked' : ''}`}>
            <div className="ubuntu-settings-toggle-knob" />
          </div>
        </div>
      </div>
    </div>
  );
}
