import React, { useState } from 'react';
import { SettingsPanelWrapper } from '../../components/SettingsPanelWrapper';
import { useSettingsStore } from '../../store/useSettingsStore';
import './MouseTouchpadPanel.css';

export function MouseTouchpadPanel() {
  const [activeTab, setActiveTab] = useState<'mouse' | 'touchpad'>('mouse');
  const [showTestModal, setShowTestModal] = useState(false);

  const { 
    primaryButton, setPrimaryButton, 
    mouseSpeed, setMouseSpeed, 
    mouseAcceleration, setMouseAcceleration,
    touchpadEnabled, setTouchpadEnabled,
    disableTouchpadWhileTyping, setDisableTouchpadWhileTyping,
    touchpadPointerSpeed, setTouchpadPointerSpeed,
    secondaryClickMethod, setSecondaryClickMethod,
    scrollMethod, setScrollMethod,
    tapToClick, setTapToClick, 
    naturalScrolling, setNaturalScrolling 
  } = useSettingsStore();

  const centerHeader = (
    <div style={{ display: 'flex', background: 'var(--color-surface-hover)', borderRadius: '6px', padding: '2px' }}>
      <button 
        onClick={() => setActiveTab('mouse')} 
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px', background: activeTab === 'mouse' ? 'var(--color-surface)' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'var(--color-text-primary)', fontSize: '13px', fontWeight: 500, boxShadow: activeTab === 'mouse' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="7"/><path d="M12 2v6"/></svg>
        Mouse
      </button>
      <button 
        onClick={() => setActiveTab('touchpad')} 
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px', background: activeTab === 'touchpad' ? 'var(--color-surface)' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'var(--color-text-primary)', fontSize: '13px', fontWeight: 500, boxShadow: activeTab === 'touchpad' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" ry="2"/></svg>
        Touchpad
      </button>
    </div>
  );

  return (
    <SettingsPanelWrapper centerHeaderContent={centerHeader} maxWidth="1280px">
      <div style={{ padding: '32px 0 48px 0', maxWidth: '1280px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {activeTab === 'mouse' && (
          <>
            <div style={{ padding: '0 12px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>General</h3>
            </div>
            <div className="ubuntu-settings-list-group">
              <div className="ubuntu-settings-list-item interactive">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                  <span>Primary Button</span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Order of physical buttons on mice and touchpads</span>
                </div>
                <div style={{ display: 'flex', background: 'var(--color-surface-hover)', borderRadius: '6px', padding: '2px' }}>
                  <button 
                    onClick={() => setPrimaryButton('left')} 
                    style={{ padding: '6px 16px', background: primaryButton === 'left' ? '#b0b0b0' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', color: primaryButton === 'left' ? '#111' : 'var(--color-text-primary)', fontSize: '13px', fontWeight: 600, minWidth: '70px' }}
                  >
                    Left
                  </button>
                  <button 
                    onClick={() => setPrimaryButton('right')} 
                    style={{ padding: '6px 16px', background: primaryButton === 'right' ? '#b0b0b0' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', color: primaryButton === 'right' ? '#111' : 'var(--color-text-primary)', fontSize: '13px', fontWeight: 600, minWidth: '70px' }}
                  >
                    Right
                  </button>
                </div>
              </div>
            </div>

            <div style={{ padding: '0 12px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Mouse</h3>
            </div>
            <div className="ubuntu-settings-list-group">
              <div className="ubuntu-settings-list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Pointer Speed</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '250px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Slow</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={mouseSpeed} 
                      onChange={(e) => setMouseSpeed(parseInt(e.target.value))}
                      className="mouse-speed-slider"
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Fast</span>
                  </div>
                </div>
              </div>
              <div className="ubuntu-settings-list-item clickable" onClick={() => setMouseAcceleration(!mouseAcceleration)}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span>Mouse Acceleration</span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Recommended for most users and applications</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-text-secondary)' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <div className={`ubuntu-settings-toggle ${mouseAcceleration ? 'checked' : ''}`}>
                    <div className="ubuntu-settings-toggle-knob" />
                  </div>
                </div>
              </div>
              <div className="ubuntu-settings-list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px', padding: '16px' }}>
                <span>Scroll Direction</span>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <ImageRadio 
                    label="Traditional" 
                    description="Scrolling moves the view" 
                    selected={!naturalScrolling} 
                    onClick={() => setNaturalScrolling(false)} 
                    image={
                      <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
                        <rect x="10" y="20" width="45" height="60" stroke="#E95420" strokeWidth="2" fill="white" />
                        <rect x="15" y="25" width="35" height="10" fill="#E95420" />
                        <rect x="15" y="40" width="15" height="15" fill="#E95420" />
                        <rect x="35" y="40" width="15" height="15" fill="#E95420" />
                        <path d="M32 65 L27 70 L37 70 Z" fill="#E95420" />
                        <path d="M32 75 L27 80 L37 80 Z" fill="#E95420" />
                        <rect x="60" y="25" width="30" height="50" rx="15" stroke="#E95420" strokeWidth="2" fill="white" />
                        <path d="M75 25 V45" stroke="#E95420" strokeWidth="2" />
                        <circle cx="75" cy="40" r="3" fill="#E95420" />
                        <path d="M75 50 L70 45 L80 45 Z" fill="#E95420" />
                      </svg>
                    }
                  />
                  <ImageRadio 
                    label="Natural" 
                    description="Scrolling moves the content" 
                    selected={naturalScrolling} 
                    onClick={() => setNaturalScrolling(true)} 
                    image={
                      <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
                        <rect x="10" y="20" width="45" height="60" stroke="#E95420" strokeWidth="2" fill="white" />
                        <rect x="15" y="25" width="35" height="10" fill="#E95420" />
                        <rect x="15" y="40" width="15" height="15" fill="#E95420" />
                        <rect x="35" y="40" width="15" height="15" fill="#E95420" />
                        <path d="M32 75 L27 70 L37 70 Z" fill="#E95420" />
                        <path d="M32 65 L27 60 L37 60 Z" fill="#E95420" />
                        <rect x="60" y="25" width="30" height="50" rx="15" stroke="#E95420" strokeWidth="2" fill="white" />
                        <path d="M75 25 V45" stroke="#E95420" strokeWidth="2" />
                        <circle cx="75" cy="40" r="3" fill="#E95420" />
                        <path d="M75 45 L70 50 L80 50 Z" fill="#E95420" />
                      </svg>
                    }
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'touchpad' && (
          <>
            <div className="ubuntu-settings-list-group">
              <div className="ubuntu-settings-list-item clickable" onClick={() => setTouchpadEnabled(!touchpadEnabled)}>
                <span>Touchpad</span>
                <div className={`ubuntu-settings-toggle ${touchpadEnabled ? 'checked' : ''}`}>
                  <div className="ubuntu-settings-toggle-knob" />
                </div>
              </div>
              <div className="ubuntu-settings-list-item clickable" onClick={() => setDisableTouchpadWhileTyping(!disableTouchpadWhileTyping)}>
                <span>Disable Touchpad While Typing</span>
                <div className={`ubuntu-settings-toggle ${disableTouchpadWhileTyping ? 'checked' : ''}`}>
                  <div className="ubuntu-settings-toggle-knob" />
                </div>
              </div>
              <div className="ubuntu-settings-list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Pointer Speed</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '250px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Slow</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={touchpadPointerSpeed} 
                      onChange={(e) => setTouchpadPointerSpeed(parseInt(e.target.value))}
                      className="mouse-speed-slider"
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Fast</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '0 12px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Clicking</h3>
            </div>
            <div className="ubuntu-settings-list-group">
              <div className="ubuntu-settings-list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px', padding: '16px' }}>
                <span>Secondary Click</span>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <ImageRadio 
                    label="Two Finger Push" 
                    description="Push anywhere with 2 fingers" 
                    selected={secondaryClickMethod === 'two-finger'} 
                    onClick={() => setSecondaryClickMethod('two-finger')} 
                    image={
                      <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
                        <rect x="15" y="25" width="70" height="50" fill="white" />
                        <path d="M45 75 V55 A5 5 0 0 1 55 55 V75 Z" fill="#E95420" />
                        <path d="M55 75 V55 A5 5 0 0 1 65 55 V75 Z" fill="#E95420" />
                        <circle cx="50" cy="50" r="15" stroke="#E95420" strokeWidth="2" opacity="0.5" />
                      </svg>
                    }
                  />
                  <ImageRadio 
                    label="Corner Push" 
                    description="Push with a single finger in the corner" 
                    selected={secondaryClickMethod === 'corner'} 
                    onClick={() => setSecondaryClickMethod('corner')} 
                    image={
                      <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
                        <rect x="15" y="25" width="70" height="50" fill="white" />
                        <path d="M70 75 V55 A5 5 0 0 1 80 55 V75 Z" fill="#E95420" />
                        <circle cx="75" cy="50" r="15" stroke="#E95420" strokeWidth="2" opacity="0.5" />
                      </svg>
                    }
                  />
                </div>
              </div>
              <div className="ubuntu-settings-list-item clickable" onClick={() => setTapToClick(!tapToClick)} style={{ flexDirection: 'column', alignItems: 'stretch', padding: '16px', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span>Tap to Click</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Quickly touch the touchpad to click</span>
                  </div>
                  <div className={`ubuntu-settings-toggle ${tapToClick ? 'checked' : ''}`}>
                    <div className="ubuntu-settings-toggle-knob" />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: '100%', height: '240px', background: '#1e1e1e', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <div style={{ transform: 'scale(1.8)' }}>
                      <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
                        <rect x="15" y="25" width="70" height="50" fill="white" />
                        <path d="M45 75 V45 A5 5 0 0 1 55 45 V75 Z" fill="#E95420" />
                        <circle cx="50" cy="40" r="12" stroke="#E95420" strokeWidth="2" opacity="0.5" strokeDasharray="4 4" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '0 12px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Scrolling</h3>
            </div>
            <div className="ubuntu-settings-list-group">
              <div className="ubuntu-settings-list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px', padding: '16px' }}>
                <span>Scroll Method</span>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <ImageRadio 
                    label="Two Finger" 
                    description="Drag two fingers on the touchpad" 
                    selected={scrollMethod === 'two-finger'} 
                    onClick={() => setScrollMethod('two-finger')} 
                    image={
                      <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
                        <rect x="15" y="25" width="70" height="50" fill="white" />
                        <path d="M45 75 V50 A5 5 0 0 1 55 50 V75 Z" fill="#E95420" />
                        <path d="M55 75 V50 A5 5 0 0 1 65 50 V75 Z" fill="#E95420" />
                        <path d="M50 40 L45 35 L55 35 Z" fill="#E95420" />
                      </svg>
                    }
                  />
                  <ImageRadio 
                    label="Edge" 
                    description="Drag one finger on the edge" 
                    selected={scrollMethod === 'edge'} 
                    onClick={() => setScrollMethod('edge')} 
                    image={
                      <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
                        <rect x="15" y="25" width="70" height="50" fill="white" />
                        <rect x="75" y="25" width="10" height="50" fill="rgba(0,0,0,0.1)" />
                        <path d="M75 75 V50 A5 5 0 0 1 85 50 V75 Z" fill="#E95420" />
                        <path d="M80 40 L75 35 L85 35 Z" fill="#E95420" />
                      </svg>
                    }
                  />
                </div>
              </div>
              <div className="ubuntu-settings-list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px', padding: '16px' }}>
                <span>Scroll Direction</span>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <ImageRadio 
                    label="Traditional" 
                    description="Scrolling moves the view" 
                    selected={!naturalScrolling} 
                    onClick={() => setNaturalScrolling(false)} 
                    image={
                      <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
                        <rect x="10" y="20" width="45" height="60" stroke="#E95420" strokeWidth="2" fill="white" />
                        <rect x="15" y="25" width="35" height="10" fill="#E95420" />
                        <rect x="15" y="40" width="15" height="15" fill="#E95420" />
                        <rect x="35" y="40" width="15" height="15" fill="#E95420" />
                        <path d="M32 65 L27 70 L37 70 Z" fill="#E95420" />
                        <path d="M32 75 L27 80 L37 80 Z" fill="#E95420" />
                        <rect x="60" y="30" width="30" height="40" fill="white" />
                        <path d="M70 70 V50 A5 5 0 0 1 80 50 V70 Z" fill="#E95420" />
                        <path d="M80 70 V50 A5 5 0 0 1 90 50 V70 Z" fill="#E95420" />
                        <path d="M75 45 L70 40 L80 40 Z" fill="#E95420" />
                      </svg>
                    }
                  />
                  <ImageRadio 
                    label="Natural" 
                    description="Scrolling moves the content" 
                    selected={naturalScrolling} 
                    onClick={() => setNaturalScrolling(true)} 
                    image={
                      <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
                        <rect x="10" y="20" width="45" height="60" stroke="#E95420" strokeWidth="2" fill="white" />
                        <rect x="15" y="25" width="35" height="10" fill="#E95420" />
                        <rect x="15" y="40" width="15" height="15" fill="#E95420" />
                        <rect x="35" y="40" width="15" height="15" fill="#E95420" />
                        <path d="M32 75 L27 70 L37 70 Z" fill="#E95420" />
                        <path d="M32 65 L27 60 L37 60 Z" fill="#E95420" />
                        <rect x="60" y="30" width="30" height="40" fill="white" />
                        <path d="M70 70 V50 A5 5 0 0 1 80 50 V70 Z" fill="#E95420" />
                        <path d="M80 70 V50 A5 5 0 0 1 90 50 V70 Z" fill="#E95420" />
                        <path d="M75 40 L70 45 L80 45 Z" fill="#E95420" />
                      </svg>
                    }
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
          <button onClick={() => setShowTestModal(true)} style={{ padding: '8px 24px', background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', borderRadius: '24px', color: 'var(--color-text-primary)', fontWeight: 600, cursor: 'pointer' }}>
            Test Settings
          </button>
        </div>
      </div>
      
      {showTestModal && (
        <TestModal onClose={() => setShowTestModal(false)} />
      )}
    </SettingsPanelWrapper>
  );
}

function ImageRadio({ label, description, selected, onClick, image }: { label: string, description: string, selected: boolean, onClick: () => void, image: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, cursor: 'pointer', padding: '8px' }} onClick={onClick}>
      <div style={{ height: '200px', display: 'flex' }}>
        <div style={{ flex: 1, background: '#1e1e1e', borderRadius: '8px', border: selected ? '2px solid var(--color-accent)' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <div style={{ transform: 'scale(1.5)' }}>
            {image}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px' }}>
        <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${selected ? 'var(--color-accent)' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {selected && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-accent)' }} />}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{label}</span>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>{description}</span>
        </div>
      </div>
    </div>
  );
}

function TestModal({ onClose }: { onClose: () => void }) {
  const [testTab, setTestTab] = useState<'clicking' | 'scrolling'>('clicking');
  
  const [clickState, setClickState] = useState({ primary: false, secondary: false, double: false });

  const handleTestClick = (type: 'primary' | 'secondary' | 'double', e?: React.MouseEvent) => {
    if (e && type === 'secondary') e.preventDefault();
    setClickState(prev => ({ ...prev, [type]: true }));
    setTimeout(() => {
      setClickState(prev => ({ ...prev, [type]: false }));
    }, 1000);
  };
  const centerHeader = (
    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', borderRadius: '6px', padding: '2px' }}>
      <button 
        onClick={() => setTestTab('clicking')} 
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px', background: testTab === 'clicking' ? 'var(--color-surface)' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'var(--color-text-primary)', fontSize: '13px', fontWeight: 500, boxShadow: testTab === 'clicking' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="7"/><path d="M12 2v6"/></svg>
        Clicking
      </button>
      <button 
        onClick={() => setTestTab('scrolling')} 
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px', background: testTab === 'scrolling' ? 'var(--color-surface)' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'var(--color-text-primary)', fontSize: '13px', fontWeight: 500, boxShadow: testTab === 'scrolling' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7"/><path d="m16 16-3 3 3 3"/><path d="m22 16-3 3 3 3"/><path d="M19 13v8"/></svg>
        Scrolling
      </button>
    </div>
  );

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '1280px', height: '480px', background: 'var(--color-bg-window)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', padding: '8px', background: 'var(--color-surface)', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ width: '32px' }} /> {/* Spacer */}
          {centerHeader}
          <button onClick={onClose} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text-secondary)', marginRight: '4px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {testTab === 'clicking' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
              <div 
                onClick={() => handleTestClick('primary')}
                onContextMenu={(e) => handleTestClick('secondary', e)}
                onDoubleClick={() => handleTestClick('double')}
                style={{ width: '220px', height: '220px', borderRadius: '50%', background: 'var(--color-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s, transform 0.1s', border: '2px solid transparent' }} 
                className="test-click-circle"
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <span style={{ fontSize: '20px', fontWeight: 600 }}>Click Here</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '180px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: clickState.primary ? 'var(--color-accent)' : 'var(--color-surface-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: clickState.primary ? '#fff' : 'var(--color-text-secondary)', transition: 'all 0.2s' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
                  </div>
                  <span style={{ fontWeight: 500, fontSize: '15px' }}>Primary Click</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: clickState.secondary ? 'var(--color-accent)' : 'var(--color-surface-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: clickState.secondary ? '#fff' : 'var(--color-text-secondary)', transition: 'all 0.2s' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
                  </div>
                  <span style={{ fontWeight: 500, fontSize: '15px' }}>Secondary Click</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: clickState.double ? 'var(--color-accent)' : 'var(--color-surface-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: clickState.double ? '#fff' : 'var(--color-text-secondary)', transition: 'all 0.2s' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
                  </div>
                  <span style={{ fontWeight: 500, fontSize: '15px' }}>Double Click</span>
                </div>
              </div>
            </div>
          )}
          {testTab === 'scrolling' && (
            <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: '100%', height: '100%', background: '#25A25A', position: 'absolute', top: 0, left: 0, overflowY: 'auto', overflowX: 'hidden' }}>
                 <div style={{ width: '100%', height: '1600px', position: 'relative' }}>
                    <svg viewBox="0 0 640 1600" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
                      <path d="M 320 0 L 320 1600" stroke="#373942" strokeWidth="120" />
                      <path d="M 320 0 L 320 1600" stroke="white" strokeWidth="8" strokeDasharray="30 30" />
                      {Array.from({ length: 12 }).map((_, i) => (
                        <g key={i} transform={`translate(0, ${i * 140})`}>
                          <circle cx="150" cy="80" r="50" fill="#186A3B" />
                          <rect x="140" y="130" width="20" height="60" fill="#6E2C00" />
                          <circle cx="480" cy="120" r="60" fill="#186A3B" />
                          <rect x="470" y="180" width="20" height="70" fill="#6E2C00" />
                        </g>
                      ))}
                    </svg>
                 </div>
              </div>

              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '120px', height: '100px', zIndex: 5, pointerEvents: 'none' }}>
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                  <g transform="translate(10, 40)">
                    <circle cx="10" cy="30" r="10" fill="#D5D8DC" stroke="#2C3E50" strokeWidth="4" />
                    <circle cx="60" cy="30" r="10" fill="#D5D8DC" stroke="#2C3E50" strokeWidth="4" />
                    <path d="M 10 30 L 60 30 L 50 15 L 20 15 Z" fill="#E74C3C" />
                    <line x1="50" y1="15" x2="60" y2="-5" stroke="#E74C3C" strokeWidth="6" strokeLinecap="round" />
                    <line x1="55" y1="-5" x2="65" y2="-5" stroke="#E74C3C" strokeWidth="6" strokeLinecap="round" />
                    <circle cx="35" cy="-20" r="18" fill="#8E44AD" />
                    <circle cx="25" cy="-35" r="8" fill="#8E44AD" />
                    <circle cx="45" cy="-35" r="8" fill="#8E44AD" />
                    <rect x="20" y="-10" width="30" height="25" rx="8" fill="#8E44AD" />
                  </g>
                </svg>
              </div>

              <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none' }}>
                <svg width="40" height="20" viewBox="0 0 40 20">
                  <path d="M 20 0 L 0 20 L 40 20 Z" fill="white" opacity="0.8" />
                </svg>
              </div>
              <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none' }}>
                <svg width="40" height="20" viewBox="0 0 40 20">
                  <path d="M 20 20 L 0 0 L 40 0 Z" fill="white" opacity="0.8" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
