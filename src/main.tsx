import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializePWA, checkForUpdates } from './utils/pwa.ts'
import { initializeNativeFeatures } from './utils/native.ts'

// FORCE UPDATE: Unregister all old service workers and clear caches
if ('serviceWorker' in navigator) {
  console.log('[FORCE UPDATE] Starting service worker cleanup...');
  navigator.serviceWorker.getRegistrations().then(registrations => {
    if (registrations.length === 0) {
      console.log('[FORCE UPDATE] No service workers to unregister');
      initializePWA();
      return;
    }
    
    const promises = registrations.map(reg => {
      console.log('[FORCE UPDATE] Unregistering old SW:', reg);
      return reg.unregister();
    });
    
    Promise.all(promises).then(() => {
      console.log('[FORCE UPDATE] All old SWs unregistered');
      // Clear all caches
      if ('caches' in window) {
        caches.keys().then(names => {
          console.log('[FORCE UPDATE] Clearing caches:', names);
          return Promise.all(names.map(name => caches.delete(name)));
        }).then(() => {
          console.log('[FORCE UPDATE] All caches cleared');
          // Now initialize the new PWA system
          initializePWA();
        });
      } else {
        initializePWA();
      }
    });
  });
} else {
  console.log('[FORCE UPDATE] Service workers not supported');
  initializePWA();
}

// Initialize native features (status bar, etc.)
initializeNativeFeatures();

// Check for updates periodically (every 60 seconds)
setInterval(() => {
  console.log('[Main] Periodic update check');
  checkForUpdates();
}, 60000);

// Check for updates when user returns to the tab
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    console.log('[Main] Visibility changed, checking for updates');
    checkForUpdates();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
