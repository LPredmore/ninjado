import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useParentalControls = (userId: string) => {
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [pinRequired, setPinRequired] = useState(false);

  useEffect(() => {
    checkPinRequired();
  }, [userId]);

  const checkPinRequired = useCallback(async () => {
    try {
      // Use safe view that doesn't expose pin_hash
      const { data, error } = await supabase
        .from('parental_controls_safe')
        .select('is_active')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking PIN requirement:', error);
        return;
      }

      setPinRequired(!!data?.is_active);
    } catch (error) {
      console.error('Error checking PIN requirement:', error);
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