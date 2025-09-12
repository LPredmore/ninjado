import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X, Smartphone } from 'lucide-react';
import { canInstall, showInstallPrompt, isIOS, isAppInstalled } from '@/utils/pwa';

export const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if we should show the install prompt
    const checkInstallAvailability = () => {
      const canShow = canInstall() && !isAppInstalled() && !isDismissed;
      setShowPrompt(canShow);
    };

    // Check periodically for install availability
    const interval = setInterval(checkInstallAvailability, 1000);
    checkInstallAvailability();

    return () => clearInterval(interval);
  }, [isDismissed]);

  const handleInstall = async () => {
    const success = await showInstallPrompt();
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowPrompt(false);
    // Remember dismissal for this session
    sessionStorage.setItem('pwa-dismissed', 'true');
  };

  useEffect(() => {
    // Check if previously dismissed this session
    const wasDismissed = sessionStorage.getItem('pwa-dismissed');
    if (wasDismissed) {
      setIsDismissed(true);
    }
  }, []);

  if (!showPrompt) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 clay-element gradient-clay-accent border-2 border-accent/30 max-w-sm mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-accent-foreground" />
            <CardTitle className="text-accent-foreground text-sm font-bold">
              Install NinjaDo
            </CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss}
            className="h-6 w-6 p-0 text-accent-foreground/60 hover:text-accent-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-accent-foreground/80 text-xs mb-3">
          {isIOS() 
            ? "Add NinjaDo to your home screen for quick access to your ninja training!"
            : "Install NinjaDo for faster access and offline capabilities!"
          }
        </CardDescription>
        
        {isIOS() ? (
          <p className="text-xs text-accent-foreground/70 mb-2">
            Tap the share button and select "Add to Home Screen"
          </p>
        ) : (
          <Button 
            onClick={handleInstall}
            size="sm"
            variant="ninja-scroll"
            className="w-full text-xs"
          >
            <Download className="w-4 h-4 mr-2" />
            Install App
          </Button>
        )}
      </CardContent>
    </Card>
  );
};