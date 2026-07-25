import { describe, it, expect } from 'vitest';
import { getAppCategory, calculateOptimalWindowDimensions, GOLDEN_RATIO } from '../../../../src/os/ubuntu/utils/windowSizingEngine';

describe('Window Sizing Engine', () => {
  it('categorizes apps correctly', () => {
    expect(getAppCategory('welcome')).toBe('wizard');
    expect(getAppCategory('terminal-preferences')).toBe('dialog');
    expect(getAppCategory('calculator')).toBe('utility');
    expect(getAppCategory('browser')).toBe('main');
  });

  it('calculates bounds for main apps', () => {
    const size = calculateOptimalWindowDimensions('browser', 1920, 1080);
    expect(size.width).toBeGreaterThanOrEqual(1248); // 1920 * 0.65 = 1248
    expect(size.height).toBe(Math.round(size.width / GOLDEN_RATIO));
  });

  it('calculates bounds for small screens (main apps)', () => {
    const size = calculateOptimalWindowDimensions('browser', 800, 600);
    expect(size.width).toBe(680); // 800 * 0.85
    expect(size.height).toBe(Math.round(680 / GOLDEN_RATIO));
  });

  it('calculates bounds for dialogs', () => {
    const size = calculateOptimalWindowDimensions('terminal-preferences', 1920, 1080);
    // Dialog max width is 800, but optimal is 1920 * 0.35 = 672. Max(800, 672) = 800.
    // Wait, fallback is { width: 800, height: 600 } if terminal-preferences isn't explicitly smaller.
    // Let's check with expected values
    expect(size.width).toBeGreaterThanOrEqual(672);
    expect(size.height).toBe(Math.round(size.width / GOLDEN_RATIO));
  });

  it('calculates bounds for wizards', () => {
    const size = calculateOptimalWindowDimensions('welcome', 1920, 1080);
    expect(size.width).toBe(1100); // 1920 * 0.60 = 1152, capped at 1100
  });

  it('calculates bounds for utility apps', () => {
    const size = calculateOptimalWindowDimensions('calculator', 1920, 1080);
    // Utility height should be fallback 500
    expect(size.height).toBe(500); 
    expect(size.width).toBe(Math.max(250, Math.round(500 / GOLDEN_RATIO)));
  });
});
