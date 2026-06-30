import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVFSStore } from '../../store';

interface NanoEditorProps {
  fileId: string;
  onExit: () => void;
}

/**
 * NanoEditor — Full GNU nano 7.2 replica.
 *
 * Layout (top to bottom):
 *   1. Title bar: "GNU nano 7.2    <filename>" (centered, white-on-grey)
 *   2. Editor area: <textarea> for editing file content
 *   3. Status/message line: Transient messages like "[ Wrote 42 lines ]"
 *   4. Shortcut bar: 2 rows × 6 columns (authentic nano layout)
 */
export function NanoEditor({ fileId, onExit }: NanoEditorProps) {
  const store = useVFSStore();
  const file = store.getNode(fileId);

  const [buffer, setBuffer] = useState(file ? file.content : '');
  const [modified, setModified] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmExit, setConfirmExit] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Track original content for dirty detection
  const originalContent = useRef(file ? file.content : '');

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Update modified flag on buffer change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setBuffer(newContent);
    setModified(newContent !== originalContent.current);
    // If we were in confirm-exit mode and user types, cancel it
    if (confirmExit) setConfirmExit(false);
  }, [confirmExit]);

  // Show a transient message
  const showMessage = useCallback((msg: string, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  }, []);

  // Save buffer to VFS
  const saveBuffer = useCallback(() => {
    store.updateContent(fileId, buffer);
    const lineCount = buffer.split('\n').length;
    showMessage(`[ Wrote ${lineCount} lines ]`);
    setModified(false);
    originalContent.current = buffer;
  }, [buffer, fileId, store, showMessage]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (confirmExit) {
      // In "Save modified buffer? (y/N)" mode
      e.preventDefault();
      if (e.key === 'y' || e.key === 'Y') {
        saveBuffer();
        onExit();
      } else if (e.key === 'n' || e.key === 'N' || e.key === 'Enter') {
        onExit();
      } else if (e.key === 'Escape') {
        setConfirmExit(false);
        setMessage('');
      }
      return;
    }

    if (e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case 'o':
          // Write Out (save)
          e.preventDefault();
          saveBuffer();
          break;

        case 's':
          // Legacy save shortcut (not in real nano, but convenient)
          e.preventDefault();
          saveBuffer();
          break;

        case 'x':
          // Exit
          e.preventDefault();
          if (modified) {
            setConfirmExit(true);
            setMessage('Save modified buffer? (y/N)');
          } else {
            onExit();
          }
          break;

        case 'g':
        case 'w':
        case 'k':
        case 'u':
        case 'j':
        case 'r':
        case '\\':
        case 't':
        case 'c':
        case '_':
          // Prevent browser default for all nano shortcuts
          e.preventDefault();
          break;

        default:
          // Prevent any other Ctrl combos from leaking
          e.preventDefault();
          break;
      }
    }
  }, [confirmExit, modified, saveBuffer, onExit]);

  if (!file) return null;

  // Filename display for title bar
  const displayName = modified ? `${file.name} (modified)` : file.name;

  return (
    <div className="nano-container">
      {/* Title bar */}
      <div className="nano-title-bar">
        GNU nano 7.2&nbsp;&nbsp;&nbsp;&nbsp;{displayName}
      </div>

      {/* Editor area */}
      <textarea
        ref={textareaRef}
        className="nano-editor"
        value={buffer}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />

      {/* Status / message line */}
      <div className="nano-status-line">
        {message}
      </div>

      {/* Shortcut bar — 2 rows × 6 columns, authentic nano layout */}
      <div className="nano-shortcut-bar">
        <span><span className="nano-shortcut-key">^G</span> Help</span>
        <span><span className="nano-shortcut-key">^O</span> Write Out</span>
        <span><span className="nano-shortcut-key">^W</span> Where Is</span>
        <span><span className="nano-shortcut-key">^K</span> Cut</span>
        <span><span className="nano-shortcut-key">^U</span> Paste</span>
        <span><span className="nano-shortcut-key">^J</span> Justify</span>

        <span><span className="nano-shortcut-key">^X</span> Exit</span>
        <span><span className="nano-shortcut-key">^R</span> Read File</span>
        <span><span className="nano-shortcut-key">^\\</span> Replace</span>
        <span><span className="nano-shortcut-key">^T</span> Execute</span>
        <span><span className="nano-shortcut-key">^C</span> Location</span>
        <span><span className="nano-shortcut-key">^_</span> Go To Line</span>
      </div>
    </div>
  );
}
