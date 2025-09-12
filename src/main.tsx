import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializePWA } from './utils/pwa.ts'

// Initialize PWA features
initializePWA();

createRoot(document.getElementById("root")!).render(<App />);
