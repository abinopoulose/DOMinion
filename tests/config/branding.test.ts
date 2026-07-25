import { describe, it, expect } from 'vitest';
import { BRANDING } from '../../src/config/branding';

describe('Branding Config', () => {
  it('should export branding constants', () => {
    expect(BRANDING).toHaveProperty('title');
    expect(BRANDING).toHaveProperty('logoUrl');
    expect(BRANDING).toHaveProperty('developerEmail');
    expect(BRANDING).toHaveProperty('devWebsite');
  });
});
