const DEFAULT_UBUNTU_ACCOUNTS = [
  { username: 'peasant', password: 'password', role: 'standard', displayName: 'LePeasant', autoLogin: false },
  { username: 'abino', password: 'admin', role: 'admin', displayName: 'Abino Poulose', autoLogin: false },
];

let cachedUbuntuAccounts: any = null;

try {
  const local = localStorage.getItem('ubuntu_accounts');
  if (local) {
    cachedUbuntuAccounts = JSON.parse(local);
  }
} catch (e) {}

export const UBUNTU_ACCOUNTS = cachedUbuntuAccounts || DEFAULT_UBUNTU_ACCOUNTS;

export function updateUbuntuAccount(username: string, updates: any) {
  const index = UBUNTU_ACCOUNTS.findIndex((a: any) => a.username === username);
  if (index !== -1) {
    UBUNTU_ACCOUNTS[index] = { ...UBUNTU_ACCOUNTS[index], ...updates };
    localStorage.setItem('ubuntu_accounts', JSON.stringify(UBUNTU_ACCOUNTS));
  }
}

