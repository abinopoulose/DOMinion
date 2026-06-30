import { useEffect, useState } from 'react';
import { useHardwareStore } from '../../store/useHardwareStore';
import './POST.css';

export function POST() {
  const { enterBIOS, enterGRUB } = useHardwareStore();
  const [interrupted, setInterrupted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1' || e.key === 'Enter') {
        setInterrupted(true);
        enterBIOS();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enterBIOS]);

  useEffect(() => {
    if (interrupted) return;
    const timer = setTimeout(() => {
      enterGRUB();
    }, 4000); // 4 second POST
    return () => clearTimeout(timer);
  }, [interrupted, enterGRUB]);

  return (
    <div className="post-container">
      <div className="post-logo">
        <h1 style={{ fontSize: '48px', margin: 0, fontStyle: 'italic', fontWeight: 900 }}>ThinkPad</h1>
        <p style={{ marginTop: '5px' }}>Press F1 to enter BIOS Setup</p>
      </div>
      <div className="post-info">
        <p>CPU: Intel(R) Core(TM) i7-10510U CPU @ 1.80GHz</p>
        <p>System Memory: 16384 MB (DDR4-2666)</p>
        <p>Initializing USB Controllers .. Done.</p>
        <p>Auto-Detecting AHCI PORT 0.. [Hitachi HTS545050A7E380]</p>
        <p>Auto-Detecting AHCI PORT 1.. [ATAPI iHAS124 W]</p>
        <p>SATA Port0: Hitachi HTS545050A7E380</p>
        <p>S.M.A.R.T. Capable and Status OK</p>
      </div>
    </div>
  );
}
