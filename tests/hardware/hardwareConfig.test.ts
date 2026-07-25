import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { hardwareConfig, getDynamicHardwareConfig } from '../../src/hardware/hardwareConfig';

describe('Hardware Config', () => {
  let originalNavigator: any;

  beforeEach(() => {
    localStorage.clear();
    originalNavigator = global.navigator;
    
    // Mock navigator
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        deviceMemory: 8,
        hardwareConcurrency: 4,
        storage: {
          estimate: vi.fn().mockResolvedValue({ quota: 256 * 1024 * 1024 * 1024 })
        }
      },
      writable: true
    });
    
    // Mock Canvas
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      getExtension: vi.fn().mockReturnValue({ UNMASKED_RENDERER_WEBGL: 1234 }),
      getParameter: vi.fn().mockReturnValue('Mocked GPU')
    }) as any;
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true
    });
  });

  it('exports default config', () => {
    expect(hardwareConfig).toHaveProperty('deviceModel');
    expect(hardwareConfig).toHaveProperty('processor');
  });

  it('fetches dynamic config based on navigator APIs', async () => {
    const config = await getDynamicHardwareConfig();
    
    expect(config.deviceModel).toBe('Macintosh');
    expect(config.memory).toBe('8.0 GiB');
    expect(config.processor).toBe('Virtual (4 Cores) @ 3.40GHz');
    expect(config.graphics).toBe('Mocked GPU');
    expect(config.diskCapacity).toBe('256 GB SSD');
  });

  it('caches dynamic config', async () => {
    await getDynamicHardwareConfig();
    
    const cached = localStorage.getItem('hardware_config_cache');
    expect(cached).toBeDefined();
    expect(JSON.parse(cached!).deviceModel).toBe('Macintosh');
    
    // Modify navigator to see if it reads from cache
    (global.navigator as any).userAgent = 'Windows NT';
    const config2 = await getDynamicHardwareConfig();
    
    expect(config2.deviceModel).toBe('Macintosh'); // still Macintosh from cache
  });
});
