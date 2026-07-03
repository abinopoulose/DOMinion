import { useState, useEffect } from 'react';

export function useBattery() {
  const [level, setLevel] = useState<number>(100);
  const [isCharging, setIsCharging] = useState<boolean>(true);

  useEffect(() => {
    let battery: any = null;
    
    const updateBattery = () => {
      if (battery) {
        setLevel(Math.round(battery.level * 100));
        setIsCharging(battery.charging);
      }
    };
    
    if ('getBattery' in navigator) {
      try {
        (navigator as any).getBattery().then((b: any) => {
          battery = b;
          updateBattery();
          b.addEventListener('levelchange', updateBattery);
          b.addEventListener('chargingchange', updateBattery);
        }).catch((e: any) => {
          console.warn('Battery API error, using fallbacks', e);
          // Fallback values already set in state
        });
      } catch (e) {
        console.warn('Battery API error, using fallbacks', e);
      }
    } else {
      console.warn('Battery API not supported, using fallbacks');
    }
    
    return () => {
      if (battery) {
        battery.removeEventListener('levelchange', updateBattery);
        battery.removeEventListener('chargingchange', updateBattery);
      }
    };
  }, []);

  return { level, isCharging };
}
