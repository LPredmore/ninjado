import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.0aa89cf809104f9489bb07221f4071b0',
  appName: 'NinjaDo',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'https://0aa89cf8-0910-4f94-89bb-07221f4071b0.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true
  }
};

export default config;
