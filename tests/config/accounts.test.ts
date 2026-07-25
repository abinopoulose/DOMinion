import { describe, it, expect, beforeEach } from 'vitest';
import { UBUNTU_ACCOUNTS, updateUbuntuAccount } from '../../src/config/accounts';

describe('Accounts Config', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  
  it('should have default accounts', () => {
    expect(UBUNTU_ACCOUNTS.length).toBeGreaterThan(0);
    expect(UBUNTU_ACCOUNTS[0].username).toBeDefined();
  });
  
  it('should update account and save to localStorage', () => {
    const targetUser = UBUNTU_ACCOUNTS[0].username;
    
    updateUbuntuAccount(targetUser, { displayName: 'New Name' });
    const account = UBUNTU_ACCOUNTS.find((a: any) => a.username === targetUser);
    expect(account?.displayName).toBe('New Name');
    
    const stored = JSON.parse(localStorage.getItem('ubuntu_accounts') || '[]');
    const storedAccount = stored.find((a: any) => a.username === targetUser);
    expect(storedAccount?.displayName).toBe('New Name');
  });
});
