import { describe, it, expect, beforeEach } from 'vitest';
import { PACKAGE_DB, getInstalledPackages, isPackageInstalled, installPackage, removePackage } from '../../../../../src/os/ubuntu/apps/Terminal/packageDb';

describe('Package DB', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('exports PACKAGE_DB list', () => {
    expect(PACKAGE_DB.length).toBeGreaterThan(0);
    expect(PACKAGE_DB.find(p => p.name === 'htop')).toBeDefined();
  });

  it('gets default installed packages', () => {
    const installed = getInstalledPackages();
    expect(installed).toContain('bash');
    expect(installed).toContain('nano');
  });

  it('installs a package', () => {
    installPackage('htop');
    expect(isPackageInstalled('htop')).toBe(true);
    expect(getInstalledPackages()).toContain('htop');
    
    // Check localStorage
    const saved = JSON.parse(localStorage.getItem('dominion-installed-packages') || '[]');
    expect(saved).toContain('htop');
  });

  it('removes a package', () => {
    installPackage('htop');
    expect(isPackageInstalled('htop')).toBe(true);
    
    removePackage('htop');
    expect(isPackageInstalled('htop')).toBe(false);
    expect(getInstalledPackages()).not.toContain('htop');
  });
  
  it('handles invalid localStorage data gracefully', () => {
    localStorage.setItem('dominion-installed-packages', 'invalid-json');
    // Should fallback to default packages
    const installed = getInstalledPackages();
    expect(installed).toContain('bash');
  });
});
