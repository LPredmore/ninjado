// PWA Utilities for NinjaDo
import { logError } from '@/lib/errorLogger';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let swRegistration: ServiceWorkerRegistration | null = null;
let updateAvailableCallback: (() => void) | null = null;

// Listen for the beforeinstallprompt event
export const initializePWA = (): void => {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e as BeforeInstallPromptEvent;
  });

  // Service worker is auto-registered by Vite-PWA, we just need to listen for updates
  if ('serviceWorker' in navigator) {
    // Get the registration when it's ready
    navigator.serviceWorker.ready.then((registration) => {
      swRegistration = registration;

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker installed and old one is still controlling
              if (updateAvailableCallback) {
                updateAvailableCallback();
              }
            }
          });
        }
      });

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60000);
    });

    // Reload page when new service worker takes control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }
};

// Set callback for when update is available
export const onUpdateAvailable = (callback: () => void): void => {
  updateAvailableCallback = callback;
};

// Check for service worker updates
export const checkForUpdates = async (): Promise<void> => {
  if (swRegistration) {
    await swRegistration.update();
  }
};

// Apply the waiting service worker update
export const applyUpdate = (): void => {
  if (swRegistration && swRegistration.waiting) {
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
};

// Check if update is available
export const isUpdateAvailable = (): boolean => {
  return !!(swRegistration && swRegistration.waiting);
};

// Show the install prompt
export const showInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    return false;
  }

  try {
    // Show the prompt
    await deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      deferredPrompt = null;
      return true;
    } else {
      return false;
    }
  } catch (error) {
    logError('Error showing install prompt', error, {
      component: 'pwa',
      action: 'showInstallPrompt',
    });
    return false;
  }
};

// Check if the app is installed
export const isAppInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

// Check if PWA install is available
export const canInstall = (): boolean => {
  return !!deferredPrompt && !isAppInstalled();
};

// Add to home screen hint for iOS
export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Check if the device supports PWA features
export const supportsPWA = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Show local notification (for task reminders, etc.)
export const showNotification = (title: string, options: NotificationOptions = {}): void => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options
    });
  }
};