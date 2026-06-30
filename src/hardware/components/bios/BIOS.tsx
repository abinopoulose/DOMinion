import { useEffect, useState } from 'react';
import { useHardwareStore } from '../../store/useHardwareStore';
import './BIOS.css';

export function BIOS() {
  const enterGRUB = useHardwareStore((s) => s.enterGRUB);
  const [activeTab, setActiveTab] = useState(0);

  const tabs = ['Main', 'Config', 'Date/Time', 'Security', 'Startup', 'Restart'];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key === 'ArrowRight') {
        setActiveTab((prev) => (prev + 1) % tabs.length);
      } else if (e.key === 'ArrowLeft') {
        setActiveTab((prev) => (prev - 1 + tabs.length) % tabs.length);
      } else if (e.key === 'F10') {
        enterGRUB();
      } else if (e.key === 'Escape') {
        enterGRUB();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs.length, enterGRUB]);

  return (
    <div className="bios-container">
      <div className="bios-header">
        <div>ThinkPad Setup</div>
      </div>
      <div className="bios-nav">
        {tabs.map((tab, i) => (
          <div key={tab} className={`bios-tab ${i === activeTab ? 'bios-tab-active' : ''}`}>
            {tab}
          </div>
        ))}
      </div>
      <div className="bios-content">
        {activeTab === 0 && (
          <div className="bios-page">
            <div className="bios-row"><span className="bios-label">System Memory:</span><span>16384 MB</span></div>
            <div className="bios-row"><span className="bios-label">CPU Type:</span><span>Intel(R) Core(TM) i7 CPU</span></div>
            <div className="bios-row"><span className="bios-label">CPU Speed:</span><span>2.80GHz</span></div>
          </div>
        )}
        {activeTab === 5 && (
          <div className="bios-page">
            <div className="bios-row"><span className="bios-label">Exit Saving Changes</span></div>
            <div className="bios-row"><span className="bios-label">Exit Discarding Changes</span></div>
            <p style={{ marginTop: '40px' }}>Press F10 to Save and Exit.</p>
          </div>
        )}
        {activeTab !== 0 && activeTab !== 5 && (
          <div className="bios-page">
            <p>Settings for {tabs[activeTab]} are not available in simulation.</p>
          </div>
        )}
      </div>
      <div className="bios-footer">
        <span>F1 Help</span>
        <span>↑↓ Select Item</span>
        <span>+/– Change Values</span>
        <span>F9 Setup Defaults</span>
        <br />
        <span>Esc Exit</span>
        <span>←→ Select Menu</span>
        <span>Enter Select ⏵ Sub-Menu</span>
        <span>F10 Save and Exit</span>
      </div>
    </div>
  );
}
