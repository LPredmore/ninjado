import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializePWA } from './utils/pwa.ts'
import { initializeNativeFeatures } from './utils/native.ts'

// Initialize PWA features
initializePWA();

// Initialize native features (status bar, etc.)
initializeNativeFeatures();

createRoot(document.getElementById("root")!).render(<App />);
