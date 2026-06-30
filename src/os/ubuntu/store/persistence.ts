import { get, set, del, createStore } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

const customStore = createStore('ubuntu-db', 'ubuntu-store');
const debouncedSetters: Record<string, any> = {};

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
