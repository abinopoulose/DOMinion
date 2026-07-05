import React from 'react';
import { useTextEditor } from './useTextEditor';
import './TextEditor.css';

interface TextEditorProps {
  windowId: string;
}

export function TextEditor({ windowId }: TextEditorProps) {
  const {
    content,
    setContent,
    fileName,
    isDirty,
    handleSave,
    handleClose
  } = useTextEditor(windowId);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="text-editor">
      <div className="text-editor-toolbar">
        <button className="primary" onClick={handleSave}>
          Save
        </button>
        <button onClick={handleClose}>
          Close
        </button>
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {fileName}{isDirty ? ' •' : ''}
        </span>
      </div>
      <textarea
        className="text-editor-textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
      />
    </div>
  );
}
