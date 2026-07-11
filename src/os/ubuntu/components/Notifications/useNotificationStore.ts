import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ubuntuIdbStorage } from '../../store/persistence';

export interface Notification {
  id: string;
  title: string;
  message: string;
  icon?: string;
  timestamp: number;
}

interface NotificationStore {
  notifications: Notification[];
  activePopup: Notification | null;
  dndEnabled: boolean;
  setDndEnabled: (val: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  dismissPopup: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],
      activePopup: null,
      dndEnabled: false,
      setDndEnabled: (val) => set({ dndEnabled: val }),
      addNotification: (notif) => {
        const newNotif: Notification = {
          ...notif,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        };
        set((state) => ({
          notifications: [newNotif, ...state.notifications],
          activePopup: state.dndEnabled ? null : newNotif, // Trigger popup only if DND is off
        }));
      },
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clearAll: () => set({ notifications: [] }),
      dismissPopup: () => set({ activePopup: null }),
    }),
    {
      name: 'ubuntu-notifications',
      storage: createJSONStorage(() => ubuntuIdbStorage),
      // Don't persist activePopup
      partialize: (state) => ({ notifications: state.notifications, dndEnabled: state.dndEnabled }),
    }
  )
);
