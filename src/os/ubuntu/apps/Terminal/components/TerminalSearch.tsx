import React, { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { LucideSearch, LucideChevronUp, LucideChevronDown, LucideSettings, LucideX } from 'lucide-react';

interface TerminalSearchProps {
  windowId: string;
  onClose: () => void;
}

export const TerminalSearch: React.FC<TerminalSearchProps> = ({ windowId, onClose }) => {
  const [query, setQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const [resultIndex, setResultIndex] = useState(-1);
  const [resultCount, setResultCount] = useState(0);

  useEffect(() => {
    const handleResults = (e: any) => {
      if (e.detail) {
        setResultIndex(e.detail.resultIndex);
        setResultCount(e.detail.resultCount);
      }
    };
    window.addEventListener('terminal:search-results', handleResults);
    return () => window.removeEventListener('terminal:search-results', handleResults);
  }, []);

  useEffect(() => {
    // Focus the input when opened
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    if (settingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [settingsOpen]);

  const dispatchSearch = (direction: 'next' | 'prev') => {
    if (!query) return;
    
    window.dispatchEvent(new CustomEvent('terminal:do-search', {
      detail: {
        windowId,
        query,
        options: {
          matchCase,
          wholeWord,
          regex: useRegex,
          incremental: false,
        },
        direction
      }
    }));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        dispatchSearch('prev');
      } else {
        dispatchSearch('next');
      }
    } else if (e.key === 'Escape') {
      onClose();
      e.stopPropagation();
      e.preventDefault();
    }
  };

  // Perform incremental search as user types
  useEffect(() => {
    if (query) {
      window.dispatchEvent(new CustomEvent('terminal:do-search', {
        detail: {
          windowId,
          query,
          options: {
            matchCase,
            wholeWord,
            regex: useRegex,
            incremental: true,
          },
          direction: 'next'
        }
      }));
    } else {
      // Clear search
      window.dispatchEvent(new CustomEvent('terminal:close-search', { detail: { windowId } }));
    }
  }, [query, matchCase, wholeWord, useRegex, windowId]);

  return (
    <div className="terminal-search-bar">
      <div className="terminal-search-input-wrapper">
        <LucideSearch size={14} className="terminal-search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="terminal-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Find..."
        />
      </div>
      
      <div className="terminal-search-actions">
        {resultCount > 0 && <span className="terminal-search-count">{resultIndex >= 0 ? resultIndex + 1 : 0} of {resultCount}</span>}
        <button 
          className="terminal-search-btn" 
          onClick={() => dispatchSearch('prev')}
          title="Previous Match (Shift+Enter)"
        >
          <LucideChevronUp size={16} />
        </button>
        <button 
          className="terminal-search-btn" 
          onClick={() => dispatchSearch('next')}
          title="Next Match (Enter)"
        >
          <LucideChevronDown size={16} />
        </button>
        
        <div style={{ position: 'relative' }} ref={settingsRef}>
          <button 
            className={`terminal-search-btn ${settingsOpen ? 'active' : ''}`}
            onClick={() => setSettingsOpen(!settingsOpen)}
            title="Search Options"
          >
            <LucideSettings size={14} />
          </button>
          
          {settingsOpen && (
            <div className="terminal-search-settings-popup">
              <label className="terminal-search-option">
                <input 
                  type="checkbox" 
                  checked={matchCase} 
                  onChange={(e) => setMatchCase(e.target.checked)} 
                />
                Match Case
              </label>
              <label className="terminal-search-option">
                <input 
                  type="checkbox" 
                  checked={wholeWord} 
                  onChange={(e) => setWholeWord(e.target.checked)} 
                />
                Whole Words
              </label>
              <label className="terminal-search-option">
                <input 
                  type="checkbox" 
                  checked={useRegex} 
                  onChange={(e) => setUseRegex(e.target.checked)} 
                />
                Use Regular Expressions
              </label>
            </div>
          )}
        </div>
        
        <button className="terminal-search-btn" onClick={onClose} title="Close Search">
          <LucideX size={16} />
        </button>
      </div>
    </div>
  );
};
