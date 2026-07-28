import { get, set, del, createStore } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

const customStore = createStore('ubuntu-db', 'ubuntu-store');
const debouncedSetters: Record<string, ReturnType<typeof setTimeout>> = {};

// Track pending debounced values for flush-on-unload
const pendingWrites: Record<string, string> = {};

export const ubuntuIdbStorage: StateStorage = {
  getItem: async (name) => (await get(name, customStore)) ?? null,
  setItem: (name, value) => {
    // Always capture latest value for emergency flush
    pendingWrites[name] = value;
    
    return new Promise<void>((resolve) => {
      if (debouncedSetters[name]) {
        clearTimeout(debouncedSetters[name]);
      }
      debouncedSetters[name] = setTimeout(() => {
        delete pendingWrites[name]; // No longer pending once written
        set(name, value, customStore).then(resolve);
      }, 300);
    });
  },
  removeItem: async (name) => {
    delete pendingWrites[name];
    await del(name, customStore);
  },
};

/**
 * Synchronously flush all pending debounced writes to IndexedDB.
 * Called on beforeunload/visibilitychange to prevent data loss.
 */
export async function flushPendingWrites(): Promise<void> {
  const entries = Object.entries(pendingWrites);
  if (entries.length === 0) return;
  
  console.log(`[Persistence] Flushing ${entries.length} pending writes...`);
  
  // Cancel all pending debounce timers
  for (const name of Object.keys(debouncedSetters)) {
    clearTimeout(debouncedSetters[name]);
    delete debouncedSetters[name];
  }
  
  // Write all pending values immediately
  const writes = entries.map(([name, value]) => {
    delete pendingWrites[name];
    return set(name, value, customStore);
  });
  
  await Promise.all(writes);
  console.log(`[Persistence] Flush complete.`);
}

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
