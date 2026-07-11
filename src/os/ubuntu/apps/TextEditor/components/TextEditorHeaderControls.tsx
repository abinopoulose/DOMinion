
import { useTextEditor } from '../hooks/useTextEditor';

export function TextEditorHeaderControls({ windowId }: { windowId: string }) {
  const { fileName, fileLocation, isDirty, handleSave } = useTextEditor(windowId);

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', WebkitAppRegion: 'drag' } as any}>
      {/* Left controls - removed to match request */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', WebkitAppRegion: 'no-drag', flex: 1 } as any}>
      </div>

      {/* Center Title & Subtitle */}
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          overflow: 'hidden',
          flex: 2,
        }}
      >
        <div 
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--color-text-primary, #ffffff)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%',
            textAlign: 'center'
          }}
        >
          {isDirty && <span style={{ color: 'var(--color-text-secondary)', marginRight: '4px' }}>•</span>}
          {fileName}
        </div>
        <div 
          style={{
            fontSize: '11px',
            color: 'var(--color-text-secondary, #999999)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%',
            textAlign: 'center',
            marginTop: '-1px'
          }}
        >
          {fileLocation}
        </div>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', WebkitAppRegion: 'no-drag', flex: 1, justifyContent: 'flex-end', paddingRight: '8px' } as any}>
         <button 
          onClick={handleSave} 
          disabled={!isDirty}
          style={{ 
            background: isDirty ? 'var(--color-accent)' : 'transparent', 
            color: isDirty ? '#fff' : 'var(--color-text-secondary)',
            border: isDirty ? '1px solid transparent' : '1px solid transparent', 
            borderRadius: '6px', 
            padding: '4px 12px', 
            fontSize: '13px',
            fontWeight: 500,
            cursor: isDirty ? 'pointer' : 'default',
            opacity: isDirty ? 1 : 0.5
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
