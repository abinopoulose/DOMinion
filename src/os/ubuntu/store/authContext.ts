import { UBUNTU_ACCOUNTS } from '../../../config/accounts';
import { useUbuntuAuthStore } from './useUbuntuAuthStore';

let tempExecutionUser: string | null = null;

/**
 * INTERNAL ONLY. Sets a temporary execution user for VFS operations.
 * Use `withElevation()` from SudoService instead of calling this directly.
 */
export function setTempExecutionUser(user: string | null) {
  tempExecutionUser = user;
}

export function getAuthContext() {
  if (tempExecutionUser) {
    return { username: tempExecutionUser, role: 'admin' };
  }
  const username = useUbuntuAuthStore.getState().currentUser || 'peasant';
  const role = UBUNTU_ACCOUNTS.find((u: any) => u.username === username)?.role || 'standard';
  return { username, role };
}
