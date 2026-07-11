import { useState } from 'react';
import { SettingsPanelWrapper } from '../../components/SettingsPanelWrapper';
import { SettingsDropdown } from '../../components/SettingsDropdown';
import { useSettingsStore } from '../../store/useSettingsStore';
import './SoundPanel.css';

const playBeep = (pan: number) => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const panner = audioCtx.createStereoPanner();
  const gainNode = audioCtx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
  
  panner.pan.value = pan; // -1 for left, 1 for right
  
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

  oscillator.connect(panner);
  panner.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.5);
};

export function SoundPanel() {
  const { systemVolume, setSystemVolume, inputVolume, setInputVolume } = useSettingsStore();
  const [balance, setBalance] = useState(50);
  const [overamp, setOveramp] = useState(false);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<'left' | 'right' | null>(null);

  const handleTestSpeaker = (side: 'left' | 'right') => {
    setActiveSpeaker(side);
    playBeep(side === 'left' ? -1 : 1);
    setTimeout(() => setActiveSpeaker(null), 500);
  };

  return (
    <SettingsPanelWrapper>
      {/* Output Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 8px', color: 'var(--color-text-primary)' }}>
        <span style={{ fontSize: '14px', fontWeight: 700 }}>Output</span>
        <div style={{ display: 'flex', gap: '2px', opacity: 0.2 }}>
          <div style={{ width: '4px', height: '4px', backgroundColor: 'currentColor', borderRadius: '1px' }} />
          <div style={{ width: '4px', height: '8px', backgroundColor: 'currentColor', borderRadius: '1px' }} />
          <div style={{ width: '4px', height: '12px', backgroundColor: 'currentColor', borderRadius: '1px' }} />
        </div>
      </div>
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '32px' }}>
        <div className="ubuntu-settings-list-item" style={{ overflow: 'visible', display: 'flex', gap: '24px' }}>
          <span style={{ minWidth: '120px' }}>Output Device</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <div style={{ flex: 1 }}>
              <SettingsDropdown
                value="speaker"
                onChange={() => {}}
                options={[
                  { 
                    value: 'speaker', 
                    label: (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                        <span>Speaker - Comet Lake PCH-LP cAVS</span>
                      </div>
                    )
                  }
                ]}
              />
            </div>
            <button onClick={() => setIsTestOpen(true)} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer', fontWeight: 500, color: 'var(--color-text-primary)', transition: 'background-color 0.2s' }}>
              Test...
            </button>
          </div>
        </div>
        
        <div className="ubuntu-settings-list-item" style={{ display: 'flex', gap: '24px' }}>
          <span style={{ minWidth: '120px' }}>Output Volume</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
            <input 
              type="range" min="0" max="100" value={systemVolume} 
              onChange={(e) => setSystemVolume(parseInt(e.target.value))}
              className="sound-volume-slider"
            />
          </div>
        </div>

        <div className="ubuntu-settings-list-item" style={{ display: 'flex', gap: '24px' }}>
          <span style={{ minWidth: '120px' }}>Balance</span>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <input 
              type="range" min="0" max="100" value={balance} 
              onChange={(e) => setBalance(parseInt(e.target.value))}
              className="sound-balance-slider"
            />
          </div>
        </div>

        <div className="ubuntu-settings-list-item interactive" onClick={() => setOveramp(!overamp)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span>Overamplification</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', opacity: 0.8 }}>Allow volume to exceed 100%, with reduced sound quality</span>
          </div>
          <div className={`ubuntu-settings-toggle ${overamp ? 'checked' : ''}`} style={{ backgroundColor: overamp ? 'var(--color-accent)' : 'rgba(0,0,0,0.15)' }}>
            <div className="ubuntu-settings-toggle-knob" style={{ transform: overamp ? 'translateX(20px)' : 'translateX(0)' }} />
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 8px', color: 'var(--color-text-primary)' }}>
        <span style={{ fontSize: '14px', fontWeight: 700 }}>Input</span>
        <div style={{ display: 'flex', gap: '2px' }}>
          <div style={{ width: '4px', height: '4px', backgroundColor: 'var(--color-accent)', borderRadius: '1px' }} />
          <div style={{ width: '4px', height: '4px', backgroundColor: 'var(--color-accent)', borderRadius: '1px', opacity: 0.3 }} />
          <div style={{ width: '4px', height: '4px', backgroundColor: 'var(--color-accent)', borderRadius: '1px', opacity: 0.3 }} />
        </div>
      </div>
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '32px' }}>
        <div className="ubuntu-settings-list-item" style={{ overflow: 'visible', display: 'flex', gap: '24px' }}>
          <span style={{ minWidth: '120px' }}>Input Device</span>
          <div style={{ flex: 1 }}>
            <SettingsDropdown
              value="mic"
              onChange={() => {}}
              options={[
                { 
                  value: 'mic', 
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                      </svg>
                      <span>Digital Microphone - Comet Lake PCH-LP cAVS</span>
                    </div>
                  )
                }
              ]}
            />
          </div>
        </div>
        
        <div className="ubuntu-settings-list-item" style={{ display: 'flex', gap: '24px' }}>
          <span style={{ minWidth: '120px' }}>Input Volume</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            <input 
              type="range" min="0" max="100" value={inputVolume} 
              onChange={(e) => setInputVolume(parseInt(e.target.value))}
              className="sound-volume-slider"
            />
          </div>
        </div>
      </div>

      {/* Sounds Section */}
      <div style={{ padding: '0 8px 8px', fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
        Sounds
      </div>
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '32px' }}>
        <div className="ubuntu-settings-list-item interactive">
          <span>Volume Levels</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
        <div className="ubuntu-settings-list-item interactive">
          <span>Alert Sound</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Default</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Test Speakers Modal */}
      {isTestOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setIsTestOpen(false)}>
          <div style={{ width: '420px', backgroundColor: 'var(--color-bg-input, #ffffff)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fadeInPanel 0.2s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', position: 'relative' }}>
              <span style={{ fontWeight: 700, fontSize: '14px' }}>Test Speakers</span>
              <button className="ubuntu-btn-secondary" onClick={() => setIsTestOpen(false)} style={{ position: 'absolute', right: '12px', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.05)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: '260px', height: '260px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Select a Speaker</span>
                
                {/* Left Speaker Button */}
                <button 
                  onClick={() => handleTestSpeaker('left')}
                  style={{ 
                    position: 'absolute', top: '50px', left: '25px', width: '40px', height: '40px', borderRadius: '50%', 
                    backgroundColor: activeSpeaker === 'left' ? 'var(--color-accent)' : 'var(--color-bg-input, #ffffff)', 
                    color: activeSpeaker === 'left' ? '#fff' : 'currentColor',
                    border: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    transition: 'all 0.1s'
                  }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: activeSpeaker === 'left' ? 1 : 0.7 }}>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                </button>
                
                {/* Right Speaker Button */}
                <button 
                  onClick={() => handleTestSpeaker('right')}
                  style={{ 
                    position: 'absolute', top: '50px', right: '25px', width: '40px', height: '40px', borderRadius: '50%', 
                    backgroundColor: activeSpeaker === 'right' ? 'var(--color-accent)' : 'var(--color-bg-input, #ffffff)',
                    color: activeSpeaker === 'right' ? '#fff' : 'currentColor',
                    border: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    transition: 'all 0.1s'
                  }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: activeSpeaker === 'right' ? 1 : 0.7, transform: 'scaleX(-1)' }}>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SettingsPanelWrapper>
  );
}
