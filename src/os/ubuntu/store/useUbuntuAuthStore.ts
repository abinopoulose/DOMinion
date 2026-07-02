import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useWindowStore } from './useUbuntuWindowStore';

/**
 * Sudo session cache entry.
 * Tracks when sudo was last authenticated for a specific terminal session.
 */
interface SudoSession {
  grantedAt: number;      // timestamp when sudo was granted
  terminalWindowId: string; // the specific terminal window
}

/**
 * Throttle tracking for failed password attempts.
 * After MAX_ATTEMPTS failures within WINDOW_MS, the user is locked out
 * for LOCKOUT_MS milliseconds.
 */
interface AttemptTracker {
  count: number;           // number of failed attempts
  firstAttemptAt: number;  // timestamp of first attempt in current window
  lockedUntil: number;     // timestamp until which the user is locked out (0 = not locked)
}

interface UbuntuAuthStore {
  currentUser: string | null;

  // Sudo credential cache: windowId → SudoSession
  sudoCache: Record<string, SudoSession>;

  // Failed attempt tracking: username → AttemptTracker
  attemptTrackers: Record<string, AttemptTracker>;

  // --- Actions ---
  login: (username: string) => void;
  logout: () => void;

  // Sudo session management
  grantSudoAccess: (windowId: string) => void;
  revokeSudoAccess: (windowId: string) => void;
  revokeAllSudoSessions: () => void;
  isSudoCached: (windowId: string) => boolean;
  getSudoTTL: () => number; // Returns configured TTL in ms (from sudoers timestamp_timeout)

  // Attempt throttling
  recordFailedAttempt: (username: string) => void;
  isThrottled: (username: string) => boolean;
  getThrottleRemainingMs: (username: string) => number;
  resetAttempts: (username: string) => void;
}

/** Sudo credential cache TTL — 15 minutes (matches Ubuntu default) */
const SUDO_TTL_MS = 15 * 60 * 1000;

/** Max failed password attempts before lockout */
const MAX_ATTEMPTS = 5;

/** Time window for tracking attempts (5 minutes) */
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000;

/** Lockout duration after max failed attempts (30 seconds) */
const LOCKOUT_MS = 30 * 1000;

export const useUbuntuAuthStore = create<UbuntuAuthStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      sudoCache: {},
      attemptTrackers: {},

      login: (username) => set({
        currentUser: username,
        sudoCache: {},          // Clear all sudo sessions on login
        attemptTrackers: {},    // Reset all attempt trackers on login
      }),

      logout: () => {
        useWindowStore.getState().clearAllWindows();
        set({
          currentUser: null,
          sudoCache: {},          // Clear all sudo sessions on logout
          attemptTrackers: {},
        });
      },

      grantSudoAccess: (windowId) => set((state) => ({
        sudoCache: {
          ...state.sudoCache,
          [windowId]: {
            grantedAt: Date.now(),
            terminalWindowId: windowId,
          }
        }
      })),

      revokeSudoAccess: (windowId) => set((state) => {
        const newCache = { ...state.sudoCache };
        delete newCache[windowId];
        return { sudoCache: newCache };
      }),

      revokeAllSudoSessions: () => set({ sudoCache: {} }),

      isSudoCached: (windowId) => {
        const session = get().sudoCache[windowId];
        if (!session) return false;
        // Handle migration from old format where sudoCache was Record<string, number>
        const grantedAt = typeof session === 'number' ? session : session.grantedAt;
        const elapsed = Date.now() - grantedAt;
        if (elapsed >= SUDO_TTL_MS) {
          // Expired — note: we don't call set() in a getter to avoid loops.
          // Cleanup happens on next grantSudoAccess or revoke call.
          return false;
        }
        return true;
      },

      getSudoTTL: () => SUDO_TTL_MS,

      recordFailedAttempt: (username) => set((state) => {
        const existing = state.attemptTrackers[username];
        const now = Date.now();

        if (existing && (now - existing.firstAttemptAt) < ATTEMPT_WINDOW_MS) {
          // Within the tracking window — increment
          const newCount = existing.count + 1;
          return {
            attemptTrackers: {
              ...state.attemptTrackers,
              [username]: {
                count: newCount,
                firstAttemptAt: existing.firstAttemptAt,
                lockedUntil: newCount >= MAX_ATTEMPTS ? now + LOCKOUT_MS : 0,
              }
            }
          };
        }

        // Outside the window or first attempt — start fresh
        return {
          attemptTrackers: {
            ...state.attemptTrackers,
            [username]: {
              count: 1,
              firstAttemptAt: now,
              lockedUntil: 0,
            }
          }
        };
      }),

      isThrottled: (username) => {
        const tracker = get().attemptTrackers[username];
        if (!tracker) return false;
        return tracker.lockedUntil > Date.now();
      },

      getThrottleRemainingMs: (username) => {
        const tracker = get().attemptTrackers[username];
        if (!tracker || tracker.lockedUntil <= Date.now()) return 0;
        return tracker.lockedUntil - Date.now();
      },

      resetAttempts: (username) => set((state) => {
        const newTrackers = { ...state.attemptTrackers };
        delete newTrackers[username];
        return { attemptTrackers: newTrackers };
      }),
    }),
    {
      name: 'ubuntu-auth-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist relevant fields, not attempt trackers (those are ephemeral)
      partialize: (state) => ({
        currentUser: state.currentUser,
        sudoCache: state.sudoCache,
      }),
    }
  )
);
