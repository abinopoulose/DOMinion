import { setStorageUserContext, setStorageSwapLock } from './persistence';
import { useSettingsStore, defaultSettingsState } from '../apps/Settings/store/useSettingsStore';
import { useTerminalProfileStore, defaultTerminalProfileState } from '../apps/Terminal/store/useTerminalProfileStore';
import { useWindowStore } from './useUbuntuWindowStore';
import { useWorkspaceStore, defaultWorkspaceState } from './useWorkspaceStore';
import { useDesktopStore, defaultDesktopState } from './useUbuntuDesktopStore';

/**
 * Executes a full environment swap in RAM when the user context changes.
 * This ensures that a new user gets their own sandboxed preferences without
 * carrying over the previous user's state.
 */
export const switchUserEnvironment = async (username: string) => {
  // Lock storage writes so factory defaults don't accidentally overwrite the DB
  setStorageSwapLock(true);

  // 1. Update the database interceptor prefix
  setStorageUserContext(username);

  // 2. Clear all windows to prevent data bleed
  useWindowStore.getState().clearAllWindows();

  // 3. Reset user-scoped stores to defaults
  // Settings
  useSettingsStore.setState(defaultSettingsState);
  // Terminal Profiles
  useTerminalProfileStore.setState(defaultTerminalProfileState);
  // Workspaces
  useWorkspaceStore.setState(defaultWorkspaceState);
  // Desktop
  useDesktopStore.setState(defaultDesktopState);

  // 4. Force rehydration from the new user's DB keys
  // This will read the values from the newly prefixed storage keys.
  // If no values exist, it will safely retain the defaults we just set.
  await Promise.all([
    useSettingsStore.persist.rehydrate(),
    useTerminalProfileStore.persist.rehydrate(),
    useWindowStore.persist.rehydrate(),
    useWorkspaceStore.persist.rehydrate(),
    useDesktopStore.persist.rehydrate(),
    import('../apps/TextEditor/hooks/useTextEditor').then(m => m.useEditorStore.persist.rehydrate())
  ]);

  // Unlock storage writes now that rehydration is complete
  setStorageSwapLock(false);

  // Open welcome window if this is a real user login and the wizard hasn't been completed yet
  if (username !== 'guest' && !localStorage.getItem('dominion-welcome-completed')) {
    useWindowStore.getState().openWindow('welcome');
  }

  console.log(`[Lifecycle] Successfully swapped environment to user: ${username}`);
};
