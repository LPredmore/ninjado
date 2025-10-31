
import { useState, useEffect, useRef, useCallback } from 'react';
import { storageManager } from '@/lib/storageManager';
import { timerManager } from '@/lib/timerManager';
import { useIntelligentRoutineStorage } from '@/hooks/useIntelligentRoutineStorage';
import { usePerformanceMeasurement, performanceMonitor } from '@/lib/performanceMonitor';

interface RoutineState {
  isRoutineStarted: boolean;
  isPaused: boolean;
  timers: { [key: string]: number };
  completedTaskIds: string[];
  lastUpdated: number; // Timestamp of last update
  pausedAt: number | null; // Timestamp when paused
  cumulativeSpeedTaskDuration: number; // Total duration of speed tasks in seconds
}

export const useRoutineState = (selectedRoutineId: string | null) => {
  const [isRoutineStarted, setIsRoutineStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timers, setTimers] = useState<{ [key: string]: number }>({});
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [cumulativeTimeSaved, setCumulativeTimeSaved] = useState<number>(0);
  const [cumulativeSpeedTaskDuration, setCumulativeSpeedTaskDuration] = useState<number>(0);
  
  const routineTimerIdRef = useRef<string | null>(null);
  
  // Track routine state performance
  usePerformanceMeasurement('routine-state-management', [
    isRoutineStarted,
    isPaused,
    Object.keys(timers).length,
    completedTaskIds.length,
  ]);
  
  // Use intelligent storage for optimized persistence
  const { forceSave, clearRoutineStorage } = useIntelligentRoutineStorage({
    routineId: selectedRoutineId,
    state: {
      isRoutineStarted,
      isPaused,
      timers,
      completedTaskIds,
      lastUpdated,
      pausedAt,
      cumulativeSpeedTaskDuration,
    },
    cumulativeTimeSaved,
  });

  // Load state from storage when component mounts or routine changes
  useEffect(() => {
    if (selectedRoutineId) {
      const savedState = storageManager.get<RoutineState>(`routineState_${selectedRoutineId}`);
      const savedCumulativeTime = storageManager.get<number>(`routine-${selectedRoutineId}-cumulative-time`, 0);
      const savedSpeedTaskDuration = storageManager.get<number>(`routine-${selectedRoutineId}-speed-duration`, 0);
      
      if (savedState) {
        setIsRoutineStarted(savedState.isRoutineStarted);
        setIsPaused(savedState.isPaused || false);
        setTimers(savedState.timers);
        setCompletedTaskIds(savedState.completedTaskIds);
        setLastUpdated(savedState.lastUpdated || Date.now());
        setPausedAt(savedState.pausedAt);
        setCumulativeTimeSaved(savedCumulativeTime);
        setCumulativeSpeedTaskDuration(savedState.cumulativeSpeedTaskDuration || savedSpeedTaskDuration);
        
        // If routine was started but not paused, calculate elapsed time since last update
        if (savedState.isRoutineStarted && !savedState.isPaused) {
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - savedState.lastUpdated) / 1000);
          
          if (elapsedSeconds > 0) {
            // Track timer synchronization performance
            performanceMonitor.startMeasurement('timer-sync-after-resume');
            
            // Optimized timer update - only update the active task to reduce calculation overhead
            setTimers(prevTimers => {
              const taskIds = Object.keys(prevTimers);
              const activeTaskIndex = taskIds.findIndex(taskId => 
                !savedState.completedTaskIds.includes(taskId)
              );
              
              if (activeTaskIndex !== -1) {
                const activeTaskId = taskIds[activeTaskIndex];
                return {
                  ...prevTimers,
                  [activeTaskId]: Math.max(prevTimers[activeTaskId] - elapsedSeconds, -999)
                };
              }
              
              return prevTimers;
            });
            
            performanceMonitor.endMeasurement('timer-sync-after-resume');
          }
        }
      } else {
        // Reset state if no saved state exists
        setIsRoutineStarted(false);
        setIsPaused(false);
        setTimers({});
        setCompletedTaskIds([]);
        setLastUpdated(Date.now());
        setPausedAt(null);
        setCumulativeTimeSaved(0);
        setCumulativeSpeedTaskDuration(0);
      }
    }
    
    // Clean up timer on unmount and force save
    return () => {
      if (routineTimerIdRef.current) {
        timerManager.removeTimer(routineTimerIdRef.current);
        routineTimerIdRef.current = null;
      }
      // Force save any pending state before unmounting
      forceSave();
    };
  }, [selectedRoutineId]);

  // Set up consolidated timer management
  useEffect(() => {
    // Clean up existing timer if routine changes
    if (routineTimerIdRef.current) {
      timerManager.removeTimer(routineTimerIdRef.current);
      routineTimerIdRef.current = null;
    }

    if (selectedRoutineId && isRoutineStarted) {
      const timerId = `routine-${selectedRoutineId}-timer`;
      routineTimerIdRef.current = timerId;

      // Create a consolidated timer for the routine
      timerManager.createTimer({
        id: timerId,
        duration: 1, // 1 second tick
        onTick: () => {
          const now = Date.now();
          setLastUpdated(now);
          
          // Optimized timer update - only update the active task to minimize re-renders
          setTimers(prevTimers => {
            const taskIds = Object.keys(prevTimers);
            const activeTaskIndex = taskIds.findIndex(taskId => 
              !completedTaskIds.includes(taskId)
            );
            
            if (activeTaskIndex !== -1) {
              const activeTaskId = taskIds[activeTaskIndex];
              const currentTime = prevTimers[activeTaskId];
              const newTime = Math.max(currentTime - 1, -999);
              
              // Only update if the time actually changed to prevent unnecessary re-renders
              if (newTime !== currentTime) {
                return {
                  ...prevTimers,
                  [activeTaskId]: newTime
                };
              }
            }
            
            return prevTimers;
          });
        },
        autoStart: !isPaused,
      });

      // Handle pause/resume
      if (isPaused) {
        timerManager.pauseTimer(timerId);
      } else {
        timerManager.startTimer(timerId);
      }
    }

    return () => {
      if (routineTimerIdRef.current) {
        timerManager.removeTimer(routineTimerIdRef.current);
        routineTimerIdRef.current = null;
      }
    };
  }, [selectedRoutineId, isRoutineStarted, isPaused, completedTaskIds]);

  // Handle pause/resume state changes
  useEffect(() => {
    if (routineTimerIdRef.current) {
      if (isPaused) {
        timerManager.pauseTimer(routineTimerIdRef.current);
      } else if (isRoutineStarted) {
        timerManager.resumeTimer(routineTimerIdRef.current);
      }
    }
  }, [isPaused, isRoutineStarted]);

  // Custom setter for pause state that also tracks pause timestamp
  const setPauseState = useCallback((paused: boolean) => {
    setIsPaused(paused);
    if (paused) {
      setPausedAt(Date.now());
    } else {
      setPausedAt(null);
      setLastUpdated(Date.now());
    }
  }, []);

  // Note: Storage operations are now handled by useIntelligentRoutineStorage hook
  // which provides optimized batching and activity-based scheduling

  const resetRoutineState = useCallback(() => {
    if (selectedRoutineId) {
      // Remove timer
      if (routineTimerIdRef.current) {
        timerManager.removeTimer(routineTimerIdRef.current);
        routineTimerIdRef.current = null;
      }
      
      // Clear storage using intelligent storage system
      clearRoutineStorage();
      
      // Reset state
      setIsRoutineStarted(false);
      setIsPaused(false);
      setTimers({});
      setCompletedTaskIds([]);
      setLastUpdated(Date.now());
      setPausedAt(null);
      setCumulativeTimeSaved(0);
      setCumulativeSpeedTaskDuration(0);
    }
  }, [selectedRoutineId, clearRoutineStorage]);

  return {
    isRoutineStarted,
    setIsRoutineStarted,
    isPaused,
    setIsPaused: setPauseState,
    timers,
    setTimers,
    completedTaskIds,
    setCompletedTaskIds,
    lastUpdated,
    resetRoutineState,
    cumulativeTimeSaved,
    setCumulativeTimeSaved,
    cumulativeSpeedTaskDuration,
    setCumulativeSpeedTaskDuration,
  };
};
