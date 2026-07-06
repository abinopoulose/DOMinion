import React from 'react';

interface TrashConfirmDialogProps {
  names: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * GNOME-style "Move to Trash?" confirmation dialog.
 */
export function TrashConfirmDialog({ names, onConfirm, onCancel }: TrashConfirmDialogProps) {
  const isSingle = names.length === 1;
  const label = isSingle ? `"${names[0]}"` : `${names.length} items`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--color-bg-window, #2d2d2d)',
          color: 'var(--color-text-primary, #fff)',
          borderRadius: '12px',
          padding: '24px 28px 20px',
          minWidth: '340px',
          maxWidth: '440px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          border: '1px solid var(--color-border, rgba(255,255,255,0.08))',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="var(--color-accent, #E95420)">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', lineHeight: 1.3 }}>
              Move to Trash?
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary, #aaa)', marginTop: '4px', lineHeight: 1.4 }}>
              {label} will be moved to the Trash. You can restore {isSingle ? 'it' : 'them'} later.
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
          <button
            autoFocus
            style={{
              padding: '8px 18px',
              borderRadius: '7px',
              border: '1px solid var(--color-border, rgba(255,255,255,0.12))',
              background: 'var(--color-surface, rgba(255,255,255,0.07))',
              color: 'var(--color-text-primary, #fff)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-hover, rgba(255,255,255,0.12))'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-surface, rgba(255,255,255,0.07))'; }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            style={{
              padding: '8px 18px',
              borderRadius: '7px',
              border: 'none',
              background: 'var(--color-accent, #E95420)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'filter 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
            onClick={onConfirm}
          >
            Move to Trash
          </button>
        </div>
      </div>
    </div>
  );
}
