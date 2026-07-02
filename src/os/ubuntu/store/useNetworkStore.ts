import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ubuntuIdbStorage } from './persistence';

interface NetworkStore {
  wifiEnabled: boolean;
  bluetoothEnabled: boolean;
  airplaneMode: boolean;
  toggleWifi: () => void;
  toggleBluetooth: () => void;
  toggleAirplaneMode: () => void;
}

export const useNetworkStore = create<NetworkStore>()(
  persist(
    (set, get) => ({
      wifiEnabled: true,
      bluetoothEnabled: false,
  airplaneMode: false,

  toggleWifi: () => {
    const { wifiEnabled, airplaneMode } = get();
    const newWifi = !wifiEnabled;
    set({ wifiEnabled: newWifi });
    
    // If turning on Wi-Fi while airplane mode is active, disable airplane mode
    if (newWifi && airplaneMode) {
      set({ airplaneMode: false });
    }
  },

  toggleBluetooth: () => {
    const { bluetoothEnabled, airplaneMode } = get();
    const newBluetooth = !bluetoothEnabled;
    set({ bluetoothEnabled: newBluetooth });
    
    // If turning on Bluetooth while airplane mode is active, disable airplane mode
    if (newBluetooth && airplaneMode) {
      set({ airplaneMode: false });
    }
  },

  toggleAirplaneMode: () => {
    const { airplaneMode } = get();
    const newAirplane = !airplaneMode;
    
    if (newAirplane) {
      // Turning ON airplane mode disables Wi-Fi and Bluetooth
      set({ 
        airplaneMode: true,
        wifiEnabled: false, 
        bluetoothEnabled: false 
      });
    } else {
      // Turning OFF airplane mode (just toggle it off, let user manually enable wifi/bt)
      set({ airplaneMode: false });
    }
  },
    }),
    {
      name: 'ubuntu-network-storage',
      storage: createJSONStorage(() => ubuntuIdbStorage),
    }
  )
);
