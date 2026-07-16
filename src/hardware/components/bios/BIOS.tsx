import { useEffect } from 'react';
import { useHardwareStore } from '../../store/useHardwareStore';
import './BIOS.css';

export function BIOS() {
  const { enterGRUB } = useHardwareStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key === 'Escape' || e.key === 'Enter') {
        enterGRUB();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enterGRUB]);

  return (
    <div className="bios-container">
      <div className="bios-header">
        <span>UEFI Firmware Settings</span>
      </div>
      <div className="bios-menu">
        <div className="bios-item bios-item-selected">
          * Exit and continue booting
        </div>
      </div>
      <div className="bios-footer">
        <p>Press ESC or Enter to exit UEFI Settings and continue to boot menu.</p>
      </div>
    </div>
  );
}
