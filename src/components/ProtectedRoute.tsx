import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PinPrompt from './PinPrompt';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/lib/errorLogger';

interface ProtectedRouteProps {
  children: React.ReactNode;
  userId: string;
  requirePin?: boolean;
}

const ProtectedRoute = ({ children, userId, requirePin = true }: ProtectedRouteProps) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkPinRequirement();
  }, [userId, requirePin]);

  const checkPinRequirement = async () => {
    if (!requirePin) {
      setIsAuthorized(true);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('check_pin_exists');

      if (error) {
        logError('Error checking PIN requirement', error, { component: 'ProtectedRoute', action: 'checkPinRequirement', userId });
        setIsAuthorized(true); // Allow access if there's an error
        return;
      }

      if (data === true) {
        // PIN exists, show prompt
        setShowPinPrompt(true);
      } else {
        // No PIN set, allow access
        setIsAuthorized(true);
      }
    } catch (error) {
      logError('Error checking PIN requirement', error, { component: 'ProtectedRoute', action: 'checkPinRequirement', userId });
      setIsAuthorized(true); // Allow access if there's an error
    }
  };

  const handlePinSuccess = () => {
    setIsAuthorized(true);
    setShowPinPrompt(false);
  };

  const handlePinCancel = () => {
    setShowPinPrompt(false);
    navigate('/', { replace: true });
  };

  if (!isAuthorized && showPinPrompt) {
    return (
      <PinPrompt
        isOpen={showPinPrompt}
        onClose={handlePinCancel}
        onSuccess={handlePinSuccess}
        title="Restricted Access"
        description="This area requires parental authorization to continue."
        userId={userId}
      />
    );
  }

  if (!isAuthorized) {
    return null; // Don't render anything while checking authorization
  }

  return <>{children}</>;
};

export default ProtectedRoute;