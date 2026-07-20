import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as fs from '../../../fs/operations';

interface NanoEditorProps {
  fileId: string;
  onExit: () => void;
}

export function NanoEditor({ fileId, onExit }: NanoEditorProps) {
  const [buffer, setBuffer] = useState('');
  const [fileName, setFileName] = useState('');
  const [filePath, setFilePath] = useState('');
  const [modified, setModified] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmExit, setConfirmExit] = useState(false);
  const [loading, setLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const originalContent = useRef('');

  useEffect(() => {
    let isMounted = true;
    async function loadFile() {
      try {
        const { getDB } = await import('../../../fs/db');
        const db = await getDB();
        const node = await db.get('inodes', fileId);
        if (node && isMounted) {
          setFileName(node.name);
          const { getAbsolutePathAsync } = await import('../../../fs/pathResolver');
          const path = await getAbsolutePathAsync(node.id);
          setFilePath(path);
          
          const blob = await fs.readFile(path);
          const text = await blob.text();
          if (isMounted) {
            setBuffer(text);
            originalContent.current = text;
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadFile();
    return () => { isMounted = false; };
  }, [fileId]);

  useEffect(() => {
    if (!loading) {
      textareaRef.current?.focus();
    }
  }, [loading]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setBuffer(newContent);
    setModified(newContent !== originalContent.current);
    if (confirmExit) setConfirmExit(false);
  }, [confirmExit]);

  const showMessage = useCallback((msg: string, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  }, []);

  const saveBuffer = useCallback(async () => {
    if (!filePath) return;
    try {
      await fs.writeFile(filePath, buffer);
      const lineCount = buffer.split('\n').length;
      showMessage(`[ Wrote ${lineCount} lines ]`);
      setModified(false);
      originalContent.current = buffer;
    } catch (err) {
      showMessage(`[ Error writing file ]`);
    }
  }, [buffer, filePath, showMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (confirmExit) {
      e.preventDefault();
      if (e.key === 'y' || e.key === 'Y') {
        saveBuffer().then(onExit);
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
        case 's':
          e.preventDefault();
          saveBuffer();
          break;
        case 'x':
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
          e.preventDefault();
          break;
        default:
          e.preventDefault();
          break;
      }
    }
  }, [confirmExit, modified, saveBuffer, onExit]);

  if (loading) return null;

  const displayName = modified ? `${fileName} (modified)` : fileName;

  return (
    <div className="nano-container">
      <div className="nano-title-bar">
        GNU nano 7.2&nbsp;&nbsp;&nbsp;&nbsp;{displayName}
      </div>
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
      <div className="nano-status-line">{message}</div>
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
