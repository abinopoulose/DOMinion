import { get, set, del } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

const debouncedSetters: Record<string, any> = {};

export const idbStorage: StateStorage = {
  getItem: async (name) => (await get(name)) ?? null,
  setItem: (name, value) => {
    return new Promise<void>((resolve) => {
      if (debouncedSetters[name]) {
        clearTimeout(debouncedSetters[name]);
      }
      debouncedSetters[name] = setTimeout(() => {
        set(name, value).then(resolve);
      }, 300);
    });
  },
  removeItem: async (name) => await del(name),
};
