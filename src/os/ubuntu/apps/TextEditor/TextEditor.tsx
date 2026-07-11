import React from 'react';
import { useTextEditor } from './hooks/useTextEditor';
import './TextEditor.css';

interface TextEditorProps {
  windowId: string;
}

export function TextEditor({ windowId }: TextEditorProps) {
  const {
    content,
    setContent,
    handleSave,
  } = useTextEditor(windowId);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="text-editor">
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
