import { useState, useCallback } from 'react';

export const useParentalControls = (userId: string) => {
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const checkPinRequired = useCallback(() => {
    const storedPin = localStorage.getItem(`ninja_pin_${userId}`);
    return !!storedPin;
  }, [userId]);

  const requestAccess = useCallback((action: () => void, skipPinCheck = false) => {
    if (skipPinCheck || !checkPinRequired()) {
      // No PIN set or PIN check skipped, execute action immediately
      action();
      return;
    }

    // PIN required, show prompt
    setPendingAction(() => action);
    setIsPinPromptOpen(true);
  }, [checkPinRequired]);

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
    checkPinRequired: checkPinRequired()
  };
};