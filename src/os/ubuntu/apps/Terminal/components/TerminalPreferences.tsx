import React, { useState } from 'react';
import { useTerminalProfileStore } from '../store/useTerminalProfileStore';
import { themes } from '../themes';
import { LucideSettings, LucideX } from 'lucide-react';

export function TerminalPreferences({ onClose }: { onClose: () => void }) {
  const { activeProfile, updateProfile, resetProfile } = useTerminalProfileStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'text' | 'colors'>('text');

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2d2d2d] text-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col h-[500px]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1e1e1e] border-b border-[#3c3c3c]">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <LucideSettings size={18} /> Terminal Preferences
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-[#3c3c3c] rounded text-gray-400 hover:text-white transition-colors">
            <LucideX size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 bg-[#252526] border-r border-[#3c3c3c] flex flex-col py-2">
            <button 
              className={`px-4 py-2 text-left text-sm ${activeTab === 'profile' ? 'bg-[#37373d] text-white' : 'text-gray-400 hover:bg-[#2a2d2e]'}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button 
              className={`px-4 py-2 text-left text-sm ${activeTab === 'text' ? 'bg-[#37373d] text-white' : 'text-gray-400 hover:bg-[#2a2d2e]'}`}
              onClick={() => setActiveTab('text')}
            >
              Text & Cursor
            </button>
            <button 
              className={`px-4 py-2 text-left text-sm ${activeTab === 'colors' ? 'bg-[#37373d] text-white' : 'text-gray-400 hover:bg-[#2a2d2e]'}`}
              onClick={() => setActiveTab('colors')}
            >
              Colors
            </button>
            
            <div className="mt-auto px-4 py-2">
              <button 
                onClick={resetProfile}
                className="w-full py-1 text-sm bg-[#523d3d] hover:bg-[#724d4d] rounded transition-colors"
              >
                Reset to Defaults
              </button>
            </div>
          </div>

          {/* Main Panel */}
          <div className="flex-1 p-6 overflow-y-auto bg-[#1e1e1e]">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Profile Name</label>
                  <input 
                    type="text" 
                    value={activeProfile.name}
                    onChange={(e) => updateProfile({ name: e.target.value })}
                    className="w-full bg-[#3c3c3c] border border-[#555] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Scrollback Lines</label>
                  <input 
                    type="number" 
                    min={100} max={10000} step={100}
                    value={activeProfile.scrollbackLines}
                    onChange={(e) => updateProfile({ scrollbackLines: parseInt(e.target.value) || 1000 })}
                    className="w-full bg-[#3c3c3c] border border-[#555] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Number of lines kept in memory.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Bell Style</label>
                  <select 
                    value={activeProfile.bellStyle}
                    onChange={(e) => updateProfile({ bellStyle: e.target.value as any })}
                    className="w-full bg-[#3c3c3c] border border-[#555] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="none">None</option>
                    <option value="visual">Visual</option>
                    <option value="sound">Sound</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Font Family</label>
                  <select 
                    value={activeProfile.fontFamily}
                    onChange={(e) => updateProfile({ fontFamily: e.target.value })}
                    className="w-full bg-[#3c3c3c] border border-[#555] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value='"Ubuntu Mono", monospace'>Ubuntu Mono</option>
                    <option value='"Fira Code", monospace'>Fira Code</option>
                    <option value='"JetBrains Mono", monospace'>JetBrains Mono</option>
                    <option value='"Courier New", monospace'>Courier New</option>
                    <option value='monospace'>System Monospace</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 flex justify-between">
                    <span>Font Size</span>
                    <span>{activeProfile.fontSize}px</span>
                  </label>
                  <input 
                    type="range" 
                    min={10} max={24} step={1}
                    value={activeProfile.fontSize}
                    onChange={(e) => updateProfile({ fontSize: parseInt(e.target.value) })}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Cursor Shape</label>
                  <div className="flex gap-4">
                    {(['block', 'underline', 'bar'] as const).map(shape => (
                      <label key={shape} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input 
                          type="radio" 
                          name="cursorShape" 
                          checked={activeProfile.cursorStyle === shape}
                          onChange={() => updateProfile({ cursorStyle: shape })}
                          className="accent-blue-500"
                        />
                        <span className="capitalize">{shape}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={activeProfile.cursorBlink}
                      onChange={(e) => updateProfile({ cursorBlink: e.target.checked })}
                      className="accent-blue-500"
                    />
                    <span>Blinking Cursor</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'colors' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Color Scheme</label>
                  <select 
                    value={activeProfile.colorScheme}
                    onChange={(e) => updateProfile({ colorScheme: e.target.value })}
                    className="w-full bg-[#3c3c3c] border border-[#555] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                  >
                    {Object.entries(themes).map(([key, theme]) => (
                      <option key={key} value={key}>{theme.name}</option>
                    ))}
                  </select>
                </div>

                {/* Preview block */}
                <div 
                  className="rounded p-4 mt-4 font-mono text-sm shadow-inner"
                  style={{ 
                    backgroundColor: themes[activeProfile.colorScheme].background,
                    color: themes[activeProfile.colorScheme].foreground 
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ color: themes[activeProfile.colorScheme].green }}>user@host</span>:
                    <span style={{ color: themes[activeProfile.colorScheme].blue }}>~</span>$ ls -la
                  </div>
                  <div>
                    <span style={{ color: themes[activeProfile.colorScheme].blue }}>drwxr-xr-x</span> 2 user user 4096 Jul 19 12:00 <span style={{ color: themes[activeProfile.colorScheme].blue }}>Downloads</span>
                  </div>
                  <div>
                    <span style={{ color: themes[activeProfile.colorScheme].green }}>-rwxr-xr-x</span> 1 user user 1024 Jul 19 12:00 <span style={{ color: themes[activeProfile.colorScheme].green }}>script.sh</span>
                  </div>
                  <div>
                    -rw-r--r-- 1 user user  512 Jul 19 12:00 document.txt
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
