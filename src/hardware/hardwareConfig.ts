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
