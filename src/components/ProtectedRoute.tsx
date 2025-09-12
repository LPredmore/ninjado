import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PinPrompt from './PinPrompt';

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
    const storedPin = localStorage.getItem(`ninja_pin_${userId}`);
    
    if (!requirePin || !storedPin) {
      // No PIN required or no PIN set, allow access
      setIsAuthorized(true);
    } else {
      // PIN required, show prompt
      setShowPinPrompt(true);
    }
  }, [userId, requirePin]);

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