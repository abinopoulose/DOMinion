import { useState, useRef, useEffect } from 'react';
import './SettingsDropdown.css';

export interface DropdownOption {
  value: string;
  label: React.ReactNode;
}

interface Props {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function SettingsDropdown({ value, options, onChange, disabled }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="settings-dropdown-container" ref={dropdownRef} style={{ opacity: disabled ? 0.5 : 1 }}>
      <div 
        className="settings-dropdown-trigger"
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        onClick={(e) => {
          if (disabled) return;
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <span className="settings-dropdown-trigger-label">{selectedOption?.label || value}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {isOpen && (
        <div className="settings-dropdown-popover">
          <div className="settings-dropdown-caret" />
          <div className="settings-dropdown-menu">
            {options.map((option) => (
              <div
                key={option.value}
                className={`settings-dropdown-item ${option.value === value ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span>{option.label}</span>
                {option.value === value && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
