import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, isAccountLocked } from '../../../../src/os/ubuntu/utils/passwordHasher';

describe('Password Hasher', () => {
  it('hashes a password in SIM format', async () => {
    const hash = await hashPassword('mypassword');
    expect(hash).toMatch(/^\$SIM\$[a-zA-Z0-9]{1,16}\$[a-f0-9]{64}$/);
  });

  it('verifies a correct password (SIM format)', async () => {
    const hash = await hashPassword('mypassword');
    expect(await verifyPassword('mypassword', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('verifies a PLAIN fallback password', async () => {
    const hash = '$PLAIN$mypassword';
    expect(await verifyPassword('mypassword', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('rejects malformed hashes', async () => {
    expect(await verifyPassword('mypassword', 'random_hash_string')).toBe(false);
    expect(await verifyPassword('mypassword', '$BAD$salt$hash')).toBe(false);
  });

  it('checks locked accounts', () => {
    expect(isAccountLocked('!')).toBe(true);
    expect(isAccountLocked('!!')).toBe(true);
    expect(isAccountLocked('*')).toBe(true);
    expect(isAccountLocked('$SIM$salt$hash')).toBe(false);
  });
  
  it('rejects passwords for locked accounts', async () => {
    expect(await verifyPassword('mypassword', '!')).toBe(false);
  });
});
