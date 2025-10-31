/**
 * Intelligent Routine Storage Hook
 * 
 * Provides optimized storage operations for routine state with:
 * - Activity-based update scheduling
 * - Reduced storage operation frequency
 * - Intelligent batching of timer state updates
 */

import { useCallback, useEffect, useRef } from 'react';
import { intelligentStorageScheduler } from '@/lib/intelligentStorageScheduler';

interface RoutineStorageState {
  isRoutineStarted: boolean;
  isPaused: boolean;
  timers: { [key: string]: number };
  completedTaskIds: string[];
  lastUpdated: number;
  pausedAt: number | null;
  cumulativeSpeedTaskDuration: number;
}

interface UseIntelligentRoutineStorageProps {
  routineId: string | null;
  state: RoutineStorageState;
  cumulativeTimeSaved: number;
}

export const useIntelligentRoutineStorage = ({
  routineId,
  state,
  cumulativeTimeSaved,
}: UseIntelligentRoutineStorageProps) => {
  const lastSaveRef = useRef<string>('');
  const saveCountRef = useRef<number>(0);

  // Generate a hash of the current state for change detection
  const generateStateHash = useCallback((currentState: RoutineStorageState, cumulative: number): string => {
    return JSON.stringify({
      ...currentState,
      cumulative,
      // Round timer values to reduce unnecessary saves for small changes
      timers: Object.fromEntries(
        Object.entries(currentState.timers).map(([key, value]) => [key, Math.floor(value)])
      ),
    });
  }, []);

  // Determine update priority based on state changes
  const getUpdatePriority = useCallback((
    currentState: RoutineStorageState,
    previousHash: string,
    currentHash: string
  ): 'low' | 'medium' | 'high' | 'critical' => {
    // Critical: Routine start/stop or task completion
    if (currentState.isRoutineStarted !== JSON.parse(previousHash || '{}').isRoutineStarted ||
        currentState.completedTaskIds.length !== JSON.parse(previousHash || '{}').completedTaskIds?.length) {
      return 'critical';
    }

    // High: Pause state changes
    if (currentState.isPaused !== JSON.parse(previousHash || '{}').isPaused) {
      return 'high';
    }

    // Medium: Timer updates during active routine
    if (currentState.isRoutineStarted && !currentState.isPaused) {
      return 'medium';
    }

    // Low: Updates when paused or routine not started
    return 'low';
  }, []);

  // Save routine state with intelligent scheduling
  const saveRoutineState = useCallback(() => {
    if (!routineId || !state.isRoutineStarted) {
      return;
    }

    const currentHash = generateStateHash(state, cumulativeTimeSaved);
    
    // Skip save if state hasn't meaningfully changed
    if (currentHash === lastSaveRef.current) {
      return;
    }

    const priority = getUpdatePriority(state, lastSaveRef.current, currentHash);
    
    // Schedule the storage updates
    intelligentStorageScheduler.scheduleUpdate(
      `routineState_${routineId}`,
      state,
      priority
    );

    intelligentStorageScheduler.scheduleUpdate(
      `routine-${routineId}-cumulative-time`,
      cumulativeTimeSaved,
      priority === 'critical' ? 'high' : 'medium' // Cumulative time is slightly less critical
    );

    lastSaveRef.current = currentHash;
    saveCountRef.current++;

    // Log save frequency in development
    if (process.env.NODE_ENV === 'development' && saveCountRef.current % 10 === 0) {
      const activityMetrics = intelligentStorageScheduler.getActivityMetrics();
      console.log(`[RoutineStorage] Saved ${saveCountRef.current} times. Activity: ${activityMetrics.isUserActive ? 'active' : 'inactive'}`);
    }
  }, [routineId, state, cumulativeTimeSaved, generateStateHash, getUpdatePriority]);

  // Auto-save when state changes
  useEffect(() => {
    saveRoutineState();
  }, [saveRoutineState]);

  // Force save on critical events
  const forceSave = useCallback(() => {
    if (routineId && state.isRoutineStarted) {
      intelligentStorageScheduler.scheduleUpdate(
        `routineState_${routineId}`,
        state,
        'critical'
      );

      intelligentStorageScheduler.scheduleUpdate(
        `routine-${routineId}-cumulative-time`,
        cumulativeTimeSaved,
        'critical'
      );
    }
  }, [routineId, state, cumulativeTimeSaved]);

  // Clear storage for routine
  const clearRoutineStorage = useCallback(() => {
    if (routineId) {
      // Schedule removal with high priority
      intelligentStorageScheduler.scheduleUpdate(`routineState_${routineId}`, null, 'high');
      intelligentStorageScheduler.scheduleUpdate(`routine-${routineId}-cumulative-time`, null, 'high');
      intelligentStorageScheduler.scheduleUpdate(`routine-${routineId}-speed-duration`, null, 'high');
      
      // Reset tracking
      lastSaveRef.current = '';
      saveCountRef.current = 0;
    }
  }, [routineId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Force save any pending updates before unmounting
      intelligentStorageScheduler.flushUpdates();
    };
  }, []);

  return {
    saveRoutineState,
    forceSave,
    clearRoutineStorage,
    saveCount: saveCountRef.current,
  };
};