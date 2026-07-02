/**
 * Password hashing utility for the Ubuntu simulation.
 *
 * Uses Web Crypto API's SHA-256 for hashing. This is NOT cryptographically
 * suitable for real authentication (use bcrypt/argon2 in production), but
 * it's perfect for an educational simulation:
 * - Demonstrates the concept of salted hashes
 * - Uses real browser crypto APIs
 * - Produces output that looks like real Linux shadow entries
 *
 * Hash format: $SIM$<salt>$<hash>
 * This mirrors Linux's $6$<salt>$<hash> (SHA-512) format.
 */

/**
 * Generate a random salt string (16 chars, base64-like).
 */
function generateSalt(): string {
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/[+/=]/g, '')  // Remove non-alphanumeric chars
    .slice(0, 16);
}

/**
 * Hash a password with a given salt using SHA-256.
 * Returns a hex string.
 */
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a password for storage in /etc/shadow.
 *
 * @param password - The plaintext password
 * @returns A shadow-compatible hash string: $SIM$<salt>$<hash>
 *
 * Usage:
 *   const hash = await hashPassword('mypassword');
 *   // Returns: "$SIM$aB3dEf1gH2iJ$a1b2c3d4e5f6..."
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt();
  const hash = await sha256(salt + password);
  return `$SIM$${salt}$${hash}`;
}

/**
 * Verify a plaintext password against a stored hash.
 *
 * @param password  - The plaintext password to verify
 * @param storedHash - The hash string from /etc/shadow
 * @returns true if the password matches
 *
 * Supports two formats:
 *   - $SIM$<salt>$<hash> — SHA-256 hashed (new format)
 *   - $PLAIN$<password> — Plaintext fallback (migration format from Task 1)
 *
 * Usage:
 *   const isValid = await verifyPassword('mypassword', storedHash);
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Handle plaintext fallback (migration from Task 1)
  if (storedHash.startsWith('$PLAIN$')) {
    return password === storedHash.slice(7);
  }

  // Handle locked/disabled accounts
  if (storedHash === '!' || storedHash === '*' || storedHash === '!!') {
    return false;
  }

  // Parse $SIM$salt$hash format
  const parts = storedHash.split('$');
  // Expected: ['', 'SIM', salt, hash]
  if (parts.length !== 4 || parts[1] !== 'SIM') {
    return false;
  }

  const salt = parts[2];
  const expectedHash = parts[3];
  const actualHash = await sha256(salt + password);

  return actualHash === expectedHash;
}

/**
 * Check if a shadow hash represents a locked account.
 * In real Linux:
 *   '!' or '!!' = locked
 *   '*' = no password (system account)
 */
export function isAccountLocked(storedHash: string): boolean {
  return storedHash === '!' || storedHash === '!!' || storedHash === '*';
}
