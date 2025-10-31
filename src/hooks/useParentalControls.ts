import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/lib/errorLogger';

export const useParentalControls = (userId: string) => {
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [pinRequired, setPinRequired] = useState(false);

  useEffect(() => {
    checkPinRequired();
  }, [userId]);

  const checkPinRequired = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('check_pin_exists');

      if (error) {
        logError('Error checking PIN requirement', error, {
          component: 'useParentalControls',
          action: 'checkPinRequired',
          userId,
        });
        setPinRequired(false); // Default to no restrictions on error
        return;
      }

      setPinRequired(data === true);
    } catch (error) {
      logError('Error checking PIN requirement', error, {
        component: 'useParentalControls',
        action: 'checkPinRequired',
        userId,
      });
      setPinRequired(false);
    }
  }, [userId]);

  const requestAccess = useCallback((action: () => void, skipPinCheck = false) => {
    if (skipPinCheck || !pinRequired) {
      // No PIN set or PIN check skipped, execute action immediately
      action();
      return;
    }

    // PIN required, show prompt
    setPendingAction(() => action);
    setIsPinPromptOpen(true);
  }, [pinRequired]);

  const handlePinSuccess = useCallback(() => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setIsPinPromptOpen(false);
  }, [pendingAction]);

  const handlePinCancel = useCallback(() => {
    setPendingAction(null);
    setIsPinPromptOpen(false);
  }, []);

  return {
    isPinPromptOpen,
    requestAccess,
    handlePinSuccess,
    handlePinCancel,
    checkPinRequired: pinRequired,
    refreshPinStatus: checkPinRequired
  };
};