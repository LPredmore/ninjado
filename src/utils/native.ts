import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { logError } from '@/lib/errorLogger';

export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const initializeNativeFeatures = async (): Promise<void> => {
  if (!isNativePlatform()) {
    return;
  }

  try {
    // Configure status bar
    await StatusBar.setStyle({ style: Style.Dark });
    
    // Set status bar background color (iOS)
    if (Capacitor.getPlatform() === 'ios') {
      await StatusBar.setBackgroundColor({ color: '#1a1a2e' });
    }
    
    // Set status bar background color (Android)
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#1a1a2e' });
      await StatusBar.setOverlaysWebView({ overlay: false });
    }
    
  } catch (error) {
    logError('Error initializing native features', error, {
      component: 'native',
      action: 'initializeNativeFeatures',
    });
  }
};

export const setStatusBarStyle = async (isDark: boolean): Promise<void> => {
  if (!isNativePlatform()) {
    return;
  }

  try {
    await StatusBar.setStyle({ 
      style: isDark ? Style.Dark : Style.Light 
    });
  } catch (error) {
    logError('Error setting status bar style', error, {
      component: 'native',
      action: 'setStatusBarStyle',
      isDark,
    });
  }
};
