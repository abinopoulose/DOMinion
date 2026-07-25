import type { AppId } from '../types/window';
import { APP_REGISTRY } from '../config/appRegistry';

export const GOLDEN_RATIO = 1.618;

export type AppCategory = 'dialog' | 'wizard' | 'main' | 'utility';

export const getAppCategory = (appId: AppId): AppCategory => {
  if (appId === 'welcome') return 'wizard';
  
  const dialogs: AppId[] = ['terminal-preferences', 'error-reporter'];
  const utilities: AppId[] = ['calculator', 'clock'];
  
  if (dialogs.includes(appId as AppId)) return 'dialog';
  if (utilities.includes(appId as AppId)) return 'utility';
  return 'main';
};

export const calculateOptimalWindowDimensions = (
  appId: AppId, 
  viewportWidth: number, 
  viewportHeight: number
): { width: number, height: number } => {
  const category = getAppCategory(appId);
  const fallbackSize = APP_REGISTRY[appId]?.defaultSize || { width: 800, height: 600 };
  
  let targetWidth = fallbackSize.width;
  let targetHeight = fallbackSize.height;

  // Maximum constraints based on viewport
  const maxAllowedWidth = viewportWidth * 0.95;
  const maxAllowedHeight = viewportHeight * 0.90;

  switch (category) {
    case 'dialog': {
      // Dialogs should be small and focused, but scale on very large screens (up to 35% of viewport).
      const optimalWidth = Math.max(fallbackSize.width, viewportWidth * 0.35);
      targetWidth = Math.min(800, Math.max(300, optimalWidth)); // Min 300px, Max 800px
      targetHeight = Math.max(200, targetWidth / GOLDEN_RATIO);
      break;
    }
    case 'wizard': {
      // Wizards (like Welcome screen) are prominent full-onboarding flows.
      // Target 60% of the screen width for great readability.
      const optimalWidth = viewportWidth * 0.60;
      targetWidth = Math.min(1100, Math.max(fallbackSize.width, optimalWidth));
      targetHeight = targetWidth / GOLDEN_RATIO;
      break;
    }
    case 'utility': {
      // Utilities (like Calculator) usually prefer vertical layouts or small footprints.
      const optimalHeight = Math.min(fallbackSize.height, viewportHeight * 0.6);
      targetHeight = Math.max(300, optimalHeight); // Never smaller than 300px
      // Reverse golden ratio for vertical apps
      targetWidth = Math.max(250, targetHeight / GOLDEN_RATIO);
      break;
    }
    case 'main': {
      // Main apps (Browser, Terminal) should occupy a substantial portion of the screen, using the golden ratio if possible.
      // E.g., target 60-70% of the screen width, then apply golden ratio for height.
      const optimalWidth = viewportWidth * 0.65;
      
      // If the screen is too small, use a larger percentile
      if (viewportWidth < 1000) {
        targetWidth = viewportWidth * 0.85;
      } else {
        targetWidth = Math.max(fallbackSize.width, optimalWidth);
      }
      
      targetHeight = targetWidth / GOLDEN_RATIO;
      break;
    }
  }

  // Final bounding box collision prevention
  const finalWidth = Math.min(targetWidth, maxAllowedWidth);
  const finalHeight = Math.min(targetHeight, maxAllowedHeight);

  // Round to prevent sub-pixel rendering issues
  return {
    width: Math.round(finalWidth),
    height: Math.round(finalHeight)
  };
};
