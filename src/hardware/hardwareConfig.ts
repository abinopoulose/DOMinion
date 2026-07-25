// Hardware configuration shared across the simulated operating systems.
// In the future, this can be dynamically populated using the browser's 
// navigator API (e.g. navigator.hardwareConcurrency, navigator.deviceMemory, etc.)

export interface HardwareConfig {
  deviceModel: string;
  processor: string;
  memory: string;
  graphics: string;
  diskCapacity: string;
}

export const hardwareConfig: HardwareConfig = {
  deviceModel: 'Lenovo ThinkPad T14 Gen 4',
  processor: 'AMD Ryzen 7 PRO 7840U w/ Radeon 780M Graphics × 16',
  memory: '16.0 GiB',
  graphics: 'AMD Radeon™ Graphics',
  diskCapacity: '512 GB SSD'
};

export async function getDynamicHardwareConfig(): Promise<HardwareConfig> {
  const cached = localStorage.getItem('hardware_config_cache');
  if (cached) {
    try {
      return { ...hardwareConfig, ...JSON.parse(cached) };
    } catch {}
  }

  const config = { ...hardwareConfig };

  // Memory
  const nav = navigator as any;
  if (nav.deviceMemory) {
    config.memory = `${nav.deviceMemory}.0 GiB`;
  }

  // Processor
  if (nav.hardwareConcurrency) {
    config.processor = `Virtual (${nav.hardwareConcurrency} Cores) @ 3.40GHz`;
  }

  // Device Model / OS
  const ua = navigator.userAgent;
  if (ua.includes('Mac OS X')) config.deviceModel = 'Macintosh';
  else if (ua.includes('Windows NT')) config.deviceModel = 'Windows PC';
  else if (ua.includes('Linux')) config.deviceModel = 'Linux Device';

  // Graphics (WebGL)
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        if (renderer) {
          config.graphics = renderer;
        }
      }
    }
  } catch {}

  // Disk Capacity
  try {
    if (nav.storage && nav.storage.estimate) {
      const estimate = await nav.storage.estimate();
      if (estimate.quota) {
        const gb = (estimate.quota / 1024 / 1024 / 1024).toFixed(0);
        config.diskCapacity = `${gb} GB SSD`;
      }
    }
  } catch {}

  localStorage.setItem('hardware_config_cache', JSON.stringify(config));
  return config;
}
