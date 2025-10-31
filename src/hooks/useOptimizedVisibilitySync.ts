/**
 * Optimized Visibility Change Synchronization Hook
 * 
 * Provides efficient timer synchronization when the app comes back into focus
 * with minimal calculation overhead and intelligent batching.
 */

import { useEffect, useRef, useCallback } from 'react';

interface VisibilitySyncConfig {
  onSync: (elapsedSeconds: number) => void;
  isActive: boolean;
  throttleMs?: number;
}

export const useOptimizedVisibilitySync = ({
  onSync,
  isActive,
  throttleMs = 100
}: VisibilitySyncConfig) => {
  const lastVisibleTimeRef = useRef<number>(Date.now());
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef<boolean>(true);

  const handleVisibilityChange = useCallback(() => {
    const now = Date.now();
    
    if (document.visibilityState === 'hidden') {
      // App going to background
      lastVisibleTimeRef.current = now;
      isVisibleRef.current = false;
      
      // Clear any pending sync operations
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    } else if (document.visibilityState === 'visible' && !isVisibleRef.current) {
      // App coming back to foreground
      isVisibleRef.current = true;
      
      if (isActive) {
        const elapsedMs = now - lastVisibleTimeRef.current;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        
        // Only sync if significant time has passed (> 1 second)
        if (elapsedSeconds > 0) {
          // Throttle sync operations to prevent excessive updates
          if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
          }
          
          syncTimeoutRef.current = setTimeout(() => {
            onSync(elapsedSeconds);
            syncTimeoutRef.current = null;
          }, throttleMs);
        }
      }
    }
  }, [onSync, isActive, throttleMs]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    // Initialize visibility state
    isVisibleRef.current = document.visibilityState === 'visible';
    lastVisibleTimeRef.current = Date.now();

    // Add optimized visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Clean up pending sync operations
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    };
  }, [handleVisibilityChange]);

  // Clean up when component unmounts or becomes inactive
  useEffect(() => {
    if (!isActive && syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
  }, [isActive]);

  // Return current visibility state for external use
  return {
    isVisible: isVisibleRef.current,
    lastVisibleTime: lastVisibleTimeRef.current,
  };
};