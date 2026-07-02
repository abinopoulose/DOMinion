export interface VirtualDevice {
  read: (offset: number) => string;
  write: (data: string) => void;
}

const APP_BOOT_TIME = Date.now();

export const virtualDevices: Record<string, VirtualDevice> = {
  // procfs
  uptime: {
    read: () => {
      const elapsed = (Date.now() - APP_BOOT_TIME) / 1000;
      return `${elapsed.toFixed(2)} ${elapsed.toFixed(2)}\n`;
    },
    write: () => { throw new Error('Permission denied'); }
  },
  meminfo: {
    read: () => {
      return `MemTotal:       16384000 kB\nMemFree:         8192000 kB\nMemAvailable:   12288000 kB\n`;
    },
    write: () => { throw new Error('Permission denied'); }
  },
  cpuinfo: {
    read: () => {
      return `processor\t: 0\nvendor_id\t: GenuineIntel\ncpu family\t: 6\nmodel\t\t: 158\nmodel name\t: Intel(R) Core(TM) i9-9900K CPU @ 3.60GHz\n`;
    },
    write: () => { throw new Error('Permission denied'); }
  },
  
  // devtmpfs
  null: {
    read: () => '', // EOF instantly
    write: () => {} // Discard
  },
  zero: {
    // Return an infinite stream of \0. Since we can't return infinite string,
    // we'll return a chunk of null bytes.
    read: () => '\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0', 
    write: () => {} // Discard
  },
  random: {
    read: () => {
      let result = '';
      for(let i = 0; i < 16; i++) {
        result += String.fromCharCode(Math.floor(Math.random() * 256));
      }
      return result;
    },
    write: () => {} // Discard
  }
};
