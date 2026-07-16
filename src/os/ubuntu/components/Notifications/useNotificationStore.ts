import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ubuntuIdbStorage } from '../../store/persistence';

export interface Notification {
  id: string;
  title: string;
  message: string;
  icon?: string;
  timestamp: number;
  progress?: number; // 0 to 100
}

interface NotificationStore {
  notifications: Notification[];
  activePopup: Notification | null;
  dndEnabled: boolean;
  setDndEnabled: (val: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
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
        const id = crypto.randomUUID();
        const newNotif: Notification = {
          ...notif,
          id,
          timestamp: Date.now(),
        };
        set((state) => ({
          notifications: [newNotif, ...state.notifications],
          activePopup: state.dndEnabled ? null : newNotif, // Trigger popup only if DND is off
        }));
        return id;
      },
      updateNotification: (id, updates) => set((state) => {
        const idx = state.notifications.findIndex((n) => n.id === id);
        if (idx === -1) return state;
        const updated = { ...state.notifications[idx], ...updates };
        const newNotifications = [...state.notifications];
        newNotifications[idx] = updated;
        
        let newActive = state.activePopup;
        if (state.activePopup?.id === id) {
          newActive = updated;
        }
        
        return {
          notifications: newNotifications,
          activePopup: newActive,
        };
      }),
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
