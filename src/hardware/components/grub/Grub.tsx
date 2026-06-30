import { useEffect, useState } from 'react';
import { useHardwareStore } from '../../store/useHardwareStore';
import './Grub.css';

export function Grub() {
  const { bootOS, enterBIOS } = useHardwareStore();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const options = [
    { id: 'ubuntu', label: 'Ubuntu' },
    { id: 'windows', label: 'Windows 11' },
    { id: 'uefi', label: 'System setup (BIOS)' },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key === 'ArrowDown') {
        setSelectedIndex((prev) => (prev + 1) % options.length);
      } else if (e.key === 'ArrowUp') {
        setSelectedIndex((prev) => (prev - 1 + options.length) % options.length);
      } else if (e.key === 'Enter') {
        const selected = options[selectedIndex].id;
        if (selected === 'ubuntu') bootOS('ubuntu');
        else if (selected === 'windows') bootOS('windows');
        else if (selected === 'uefi') enterBIOS();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, bootOS, enterBIOS, options]);

  return (
    <div className="grub-container">
      <div className="grub-box">
        <h1 className="grub-title">GNU GRUB version 2.06</h1>
        <div className="grub-menu">
          {options.map((opt, i) => (
            <div
              key={opt.id}
              className={`grub-item ${i === selectedIndex ? 'grub-item-selected' : ''}`}
            >
              {i === selectedIndex ? '*' : ' '} {opt.label}
            </div>
          ))}
        </div>
        <div className="grub-help">
          <p>
            Use the ↑ and ↓ keys to select which entry is highlighted.
            <br />
            Press enter to boot the selected OS, 'e' to edit the commands before booting or 'c' for a command-line.
          </p>
        </div>
      </div>
    </div>
  );
}
