import { get, set, del, createStore } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

const customStore = createStore('ubuntu-db', 'ubuntu-store');
const debouncedSetters: Record<string, ReturnType<typeof setTimeout>> = {};

export const ubuntuIdbStorage: StateStorage = {
  getItem: async (name) => (await get(name, customStore)) ?? null,
  setItem: (name, value) => {
    return new Promise<void>((resolve) => {
      if (debouncedSetters[name]) {
        clearTimeout(debouncedSetters[name]);
      }
      debouncedSetters[name] = setTimeout(() => {
        set(name, value, customStore).then(resolve);
      }, 300);
    });
  },
  removeItem: async (name) => await del(name, customStore),
};

// --- Multi-User Sandboxed Storage Context ---
let currentStorageUser = 'peasant';
let isSwapping = false;

export const setStorageSwapLock = (locked: boolean) => {
  isSwapping = locked;
};

/** 
 * Call this upon login/logout to change the DB prefix namespace
 */
export const setStorageUserContext = (user: string) => {
  currentStorageUser = user;
};

/**
 * Wraps any StateStorage (localStorage or IDB) to prefix keys with the current user.
 * This guarantees 100% data separation between different accounts.
 */
export const userScopedStorage = (baseStorage: StateStorage): StateStorage => ({
  getItem: async (name) => {
    return await baseStorage.getItem(`${currentStorageUser}_${name}`);
  },
  setItem: async (name, value) => {
    if (isSwapping) return; // Prevent overwriting DB with factory defaults during swap
    return await baseStorage.setItem(`${currentStorageUser}_${name}`, value);
  },
  removeItem: async (name) => {
    return await baseStorage.removeItem(`${currentStorageUser}_${name}`);
  }
});
