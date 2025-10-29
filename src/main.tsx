import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializePWA, checkForUpdates } from './utils/pwa.ts'
import { initializeNativeFeatures } from './utils/native.ts'

// Initialize PWA features
initializePWA();

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
