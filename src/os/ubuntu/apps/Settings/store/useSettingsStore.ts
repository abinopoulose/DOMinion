import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ubuntuIdbStorage } from '../../../store/persistence';

export type SettingsPanel = 
  | 'wifi'
  | 'network'
  | 'bluetooth'
  | 'appearance'
  | 'ubuntu-desktop'
  | 'search'
  | 'multitasking'
  | 'apps'
  | 'notifications'
  | 'privacy'
  | 'online-accounts'
  | 'sharing'
  | 'sound'
  | 'power'
  | 'displays'
  | 'mouse'
  | 'keyboard'
  | 'printers'
  | 'removable-media'
  | 'color'
  | 'accessibility'
  | 'system';

export type SystemSubPage = 
  | 'root'
  | 'region-language'
  | 'date-time'
  | 'users'
  | 'remote-desktop'
  | 'secure-shell'
  | 'about';

interface SettingsState {
  activePanel: SettingsPanel;
  systemSubPage: SystemSubPage;
  theme: 'light' | 'dark';
  accentColor: string;
  nightLight: boolean;
  dockPosition: 'left' | 'bottom' | 'right';
  dockIconSize: number;
  dockAutoHide: boolean;
  showDesktopIcons: boolean;
  wallpaper: string;
  powerMode: 'performance' | 'balanced' | 'power-saver';
  screenBlank: string;
  systemVolume: number;
  inputVolume: number;
  screenBrightness: number;
  hotCorner: boolean;
  activeScreenEdges: boolean;
  workspaceType: 'dynamic' | 'fixed';
  primaryButton: 'left' | 'right';
  mouseSpeed: number;
  tapToClick: boolean;
  naturalScrolling: boolean;
  highContrast: boolean;
  largeText: boolean;
  switchDesktopShortcut: string;
  switchAppShortcut: string;
  desktopIconOrder: string[];
  desktopIconPositions: Record<string, { x: number; y: number }>;
  pinnedApps: string[];
  
  // Actions
  setActivePanel: (panel: SettingsPanel) => void;
  setSystemSubPage: (page: SystemSubPage) => void;
  goBackFromSubPage: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setAccentColor: (color: string) => void;
  setNightLight: (enabled: boolean) => void;
  setDockPosition: (position: 'left' | 'bottom' | 'right') => void;
  setDockIconSize: (size: number) => void;
  setDockAutoHide: (autoHide: boolean) => void;
  setShowDesktopIcons: (show: boolean) => void;
  setWallpaper: (wallpaper: string) => void;
  setPowerMode: (mode: 'performance' | 'balanced' | 'power-saver') => void;
  setScreenBlank: (value: string) => void;
  setSystemVolume: (v: number) => void;
  setInputVolume: (v: number) => void;
  setScreenBrightness: (v: number) => void;
  setHotCorner: (v: boolean) => void;
  setActiveScreenEdges: (v: boolean) => void;
  setWorkspaceType: (v: 'dynamic' | 'fixed') => void;
  setPrimaryButton: (v: 'left' | 'right') => void;
  setMouseSpeed: (v: number) => void;
  setTapToClick: (v: boolean) => void;
  setNaturalScrolling: (v: boolean) => void;
  setHighContrast: (v: boolean) => void;
  setLargeText: (v: boolean) => void;
  setSwitchDesktopShortcut: (v: string) => void;
  setSwitchAppShortcut: (v: string) => void;
  setDesktopIconOrder: (v: string[]) => void;
  setDesktopIconPositions: (v: Record<string, { x: number; y: number }>) => void;
  setPinnedApps: (v: string[]) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      activePanel: 'wifi',
      systemSubPage: 'root',
      theme: 'light',
      accentColor: '#E95420',
      nightLight: false,
      dockPosition: 'left',
      dockIconSize: 48,
      dockAutoHide: false,
      showDesktopIcons: true,
      wallpaper: '',
      powerMode: 'balanced',
      screenBlank: '5',
      systemVolume: 70,
      inputVolume: 50,
      screenBrightness: 100,
      hotCorner: true,
      activeScreenEdges: true,
      workspaceType: 'dynamic',
      primaryButton: 'left',
      mouseSpeed: 50,
      tapToClick: true,
      naturalScrolling: true,
      highContrast: false,
      largeText: false,
      switchDesktopShortcut: 'ctrl+alt+arrow',
      switchAppShortcut: 'alt+tab',
      desktopIconOrder: [],
      desktopIconPositions: {},
      pinnedApps: ['file-manager', 'terminal', 'browser', 'settings'],
      
      setActivePanel: (panel) => set({ activePanel: panel, systemSubPage: 'root' }),
      setSystemSubPage: (page) => set({ systemSubPage: page }),
      goBackFromSubPage: () => set({ systemSubPage: 'root' }),
      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setNightLight: (nightLight) => set({ nightLight }),
      setDockPosition: (dockPosition) => set({ dockPosition }),
      setDockIconSize: (dockIconSize) => set({ dockIconSize }),
      setDockAutoHide: (dockAutoHide) => set({ dockAutoHide }),
      setShowDesktopIcons: (showDesktopIcons) => set({ showDesktopIcons }),
      setWallpaper: (wallpaper) => set({ wallpaper }),
      setPowerMode: (powerMode) => set({ powerMode }),
      setScreenBlank: (screenBlank) => set({ screenBlank }),
      setSystemVolume: (systemVolume) => set({ systemVolume }),
      setInputVolume: (inputVolume) => set({ inputVolume }),
      setScreenBrightness: (screenBrightness) => set({ screenBrightness }),
      setHotCorner: (hotCorner) => set({ hotCorner }),
      setActiveScreenEdges: (activeScreenEdges) => set({ activeScreenEdges }),
      setWorkspaceType: (workspaceType) => set({ workspaceType }),
      setPrimaryButton: (primaryButton) => set({ primaryButton }),
      setMouseSpeed: (mouseSpeed) => set({ mouseSpeed }),
      setTapToClick: (tapToClick) => set({ tapToClick }),
      setNaturalScrolling: (naturalScrolling) => set({ naturalScrolling }),
      setHighContrast: (highContrast) => set({ highContrast }),
      setLargeText: (largeText) => set({ largeText }),
      setSwitchDesktopShortcut: (switchDesktopShortcut) => set({ switchDesktopShortcut }),
      setSwitchAppShortcut: (switchAppShortcut) => set({ switchAppShortcut }),
      setDesktopIconOrder: (desktopIconOrder) => set({ desktopIconOrder }),
      setDesktopIconPositions: (desktopIconPositions) => set({ desktopIconPositions }),
      setPinnedApps: (pinnedApps) => set({ pinnedApps }),
    }),
    {
      name: 'ubuntu-settings-storage',
      storage: createJSONStorage(() => ubuntuIdbStorage),
      partialize: (state) => ({
        theme: state.theme,
        accentColor: state.accentColor,
        nightLight: state.nightLight,
        dockPosition: state.dockPosition,
        dockIconSize: state.dockIconSize,
        dockAutoHide: state.dockAutoHide,
        showDesktopIcons: state.showDesktopIcons,
        wallpaper: state.wallpaper,
        powerMode: state.powerMode,
        screenBlank: state.screenBlank,
        systemVolume: state.systemVolume,
        inputVolume: state.inputVolume,
        screenBrightness: state.screenBrightness,
        hotCorner: state.hotCorner,
        activeScreenEdges: state.activeScreenEdges,
        workspaceType: state.workspaceType,
        primaryButton: state.primaryButton,
        mouseSpeed: state.mouseSpeed,
        tapToClick: state.tapToClick,
        naturalScrolling: state.naturalScrolling,
        highContrast: state.highContrast,
        largeText: state.largeText,
        switchDesktopShortcut: state.switchDesktopShortcut,
        switchAppShortcut: state.switchAppShortcut,
        desktopIconOrder: state.desktopIconOrder,
        desktopIconPositions: state.desktopIconPositions,
        pinnedApps: state.pinnedApps,
      }),
    }
  )
);
