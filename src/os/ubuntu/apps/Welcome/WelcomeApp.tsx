import React, { useState, useRef } from 'react';
import { useUbuntuAuthStore } from '../../store/useUbuntuAuthStore';
import { useWindowStore } from '../../store/useUbuntuWindowStore';
import { useWindowDrag } from '../../hooks/useWindowDrag';
import { WelcomeStep1 } from './WelcomeStep1';
import { WelcomeStep2 } from './WelcomeStep2';
import { WelcomeStep3 } from './WelcomeStep3';

export function WelcomeApp({ windowId }: { windowId: string }) {
  const [step, setStep] = useState(1);
  const [downloadProgress, setDownloadProgress] = useState(-1);
  const [logs, setLogs] = useState<string[]>([]);
  const isPausedRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);

  const closeWindow = useWindowStore((s) => s.closeWindow);
  const win = useWindowStore((s) => s.windows.find((w) => w.id === windowId));
  const updatePosition = useWindowStore((s) => s.updatePosition);
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize);
  const tileWindow = useWindowStore((s) => s.tileWindow);

  const { dragHandlers } = useWindowDrag({
    position: win?.position || { x: 0, y: 0 },
    size: win?.size || { width: 0, height: 0 },
    isMaximized: win?.isMaximized || false,
    onPositionChange: (pos) => updatePosition(windowId, pos),
    onFocus: () => {},
    onMaximize: () => toggleMaximize(windowId),
    onRestore: () => {
      if (win?.tileState) {
        tileWindow(windowId, null);
      } else {
        toggleMaximize(windowId);
      }
    },
    onTile: (side) => tileWindow(windowId, side),
  });

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', position: 'relative', background: '#ffffff', color: '#1a1a1a', borderRadius: '8px', overflow: 'hidden', userSelect: 'none', WebkitUserSelect: 'none' }}>
      <style>
        {`
          @keyframes welcome-progress-slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(500%); }
          }
          .welcome-terminal::-webkit-scrollbar {
            display: none;
          }
          .welcome-terminal {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
      
      {/* Invisible Draggable Header */}
      <div 
        {...dragHandlers}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '48px', zIndex: 15, cursor: 'default' }}
      />

      {step === 1 && <WelcomeStep1 onNext={() => setStep(2)} />}
      {step === 2 && (
        <WelcomeStep2 
          onBack={() => setStep(1)} 
          onNext={() => setStep(3)}
          downloadProgress={downloadProgress}
          setDownloadProgress={setDownloadProgress}
          logs={logs}
          setLogs={setLogs}
          isPausedRef={isPausedRef}
          isPaused={isPaused}
          setIsPaused={setIsPaused}
          showTerminal={showTerminal}
          setShowTerminal={setShowTerminal}
        />
      )}
      {step === 3 && <WelcomeStep3 onFinish={() => closeWindow(windowId)} />}
    </div>
  );
}
