import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { onUpdateAvailable, applyUpdate, isUpdateAvailable } from '@/utils/pwa';

const UpdatePrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Set up callback for when update is available
    onUpdateAvailable(() => {
      console.log('[UpdatePrompt] Update available callback triggered');
      setShowPrompt(true);
    });

    // Also check periodically in case we missed the event
    const interval = setInterval(() => {
      if (isUpdateAvailable()) {
        console.log('[UpdatePrompt] Update detected via polling');
        setShowPrompt(true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleUpdate = () => {
    console.log('[UpdatePrompt] User clicked update button');
    applyUpdate();
    // The page will reload automatically when the new SW takes control
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
      <Card className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl border-2 border-amber-600">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚀</span>
            <div className="flex-1">
              <h3 className="font-bold text-lg">New Version Available!</h3>
              <p className="text-sm text-white/90">
                A new version of NinjaDo is ready. Click to update now!
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleUpdate}
              className="flex-1 bg-white text-amber-600 hover:bg-amber-50 font-bold"
            >
              Update Now
            </Button>
            <Button
              onClick={() => setShowPrompt(false)}
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              Later
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UpdatePrompt;
