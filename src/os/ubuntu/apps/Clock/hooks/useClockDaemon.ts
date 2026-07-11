import { useEffect } from 'react';
import { useTimerStore } from '../store/useTimerStore';
import { useAlarmStore } from '../store/useAlarmStore';
import { useNotificationStore } from '../../../components/Notifications/useNotificationStore';

export function useClockDaemon() {
  useEffect(() => {
    const timer = setInterval(() => {
      // Check Timer
      const timerState = useTimerStore.getState();
      if (timerState.isRunning && timerState.startTime !== null) {
        const elapsed = Date.now() - timerState.startTime;
        const remaining = timerState.duration - elapsed;
        if (remaining <= 0) {
          timerState.resetTimer();
          useNotificationStore.getState().addNotification({
            title: 'Timer Finished',
            message: 'Time is up! Your timer has finished.',
            icon: '⏱️'
          });
        }
      }

      // Check Alarms
      const alarmState = useAlarmStore.getState();
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentSecond = now.getSeconds();

      // Trigger alarm exactly at second 0
      if (currentSecond === 0) {
        alarmState.alarms.forEach(alarm => {
          if (alarm.active && alarm.hour === currentHour && alarm.minute === currentMinute) {
            useNotificationStore.getState().addNotification({
              title: 'Alarm Ringing',
              message: alarm.label || 'Wake up!',
              icon: '⏰'
            });
            
            // Toggle off one-time alarms
            if (!alarm.repeatDays || alarm.repeatDays.length === 0) {
              alarmState.toggleAlarm(alarm.id, false);
            }
          }
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);
}
