import { useState, useRef, useEffect } from 'react';
import { LucideChevronDown, LucideCheck } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string;
}

interface Props {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
}

export function TerminalPrefsSelect({ value, options, onChange, className = '' }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className={`term-prefs-custom-select ${className}`} ref={containerRef}>
      <button 
        className="term-prefs-custom-select-btn" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption?.label}</span>
        <LucideChevronDown size={14} />
      </button>

      {isOpen && (
        <div className="term-prefs-custom-select-menu">
          {options.map(opt => (
            <button
              key={opt.value}
              className={`term-prefs-custom-select-item ${opt.value === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              <span>{opt.label}</span>
              {opt.value === value && <LucideCheck size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
