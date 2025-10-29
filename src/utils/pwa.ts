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
  // Don't register service worker if running in Capacitor
  if ((window as any).Capacitor) {
    return;
  }

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e as BeforeInstallPromptEvent;
  });

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service worker registered:', registration);
        swRegistration = registration;

        // Check for updates on registration
        registration.update();

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[PWA] Update found, new worker installing');

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              console.log('[PWA] New worker state:', newWorker.state);
              
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker installed and old one is still controlling
                console.log('[PWA] New version available!');
                if (updateAvailableCallback) {
                  updateAvailableCallback();
                }
              }
            });
          }
        });

        // Reload page when new service worker takes control
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          console.log('[PWA] Controller changed, reloading page');
          refreshing = true;
          window.location.reload();
        });
      })
      .catch((registrationError) => {
        logError('Service worker registration failed', registrationError, {
          component: 'pwa',
          action: 'initializePWA',
        });
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
    console.log('[PWA] Checking for updates...');
    await swRegistration.update();
  }
};

// Apply the waiting service worker update
export const applyUpdate = (): void => {
  if (swRegistration && swRegistration.waiting) {
    console.log('[PWA] Applying update by sending SKIP_WAITING message');
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