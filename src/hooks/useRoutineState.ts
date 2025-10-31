
import { useState, useEffect, useRef } from 'react';

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
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load state from localStorage when component mounts or routine changes
  useEffect(() => {
    if (selectedRoutineId) {
      const savedState = localStorage.getItem(`routineState_${selectedRoutineId}`);
      const savedCumulativeTime = localStorage.getItem(`routine-${selectedRoutineId}-cumulative-time`);
      const savedSpeedTaskDuration = localStorage.getItem(`routine-${selectedRoutineId}-speed-duration`);
      
      if (savedState) {
        const parsed = JSON.parse(savedState) as RoutineState;
        setIsRoutineStarted(parsed.isRoutineStarted);
        setIsPaused(parsed.isPaused || false);
        setTimers(parsed.timers);
        setCompletedTaskIds(parsed.completedTaskIds);
        setLastUpdated(parsed.lastUpdated || Date.now());
        setPausedAt(parsed.pausedAt);
        setCumulativeTimeSaved(savedCumulativeTime ? parseInt(savedCumulativeTime) : 0);
        setCumulativeSpeedTaskDuration(parsed.cumulativeSpeedTaskDuration || (savedSpeedTaskDuration ? parseInt(savedSpeedTaskDuration) : 0));
        
        // If routine was started but not paused, calculate elapsed time since last update
        if (parsed.isRoutineStarted && !parsed.isPaused) {
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - parsed.lastUpdated) / 1000);
          
          if (elapsedSeconds > 0) {
            // Update timers to account for elapsed time
            setTimers(prevTimers => {
              const newTimers = { ...prevTimers };
              let activeTaskFound = false;
              
              // Find the first non-completed task
              Object.keys(newTimers).some(taskId => {
                if (!parsed.completedTaskIds.includes(taskId) && !activeTaskFound) {
                  activeTaskFound = true;
                  // For focus tasks, continue counting into negative
                  newTimers[taskId] = Math.max(newTimers[taskId] - elapsedSeconds, -999);
                  return false;
                }
                return false;
              });
              
              return newTimers;
            });
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
    
    // Clean up interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [selectedRoutineId]);

  // Set up timer with visibility change detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRoutineStarted && !isPaused) {
        const now = Date.now();
        const lastTime = lastUpdated;
        const elapsedSeconds = Math.floor((now - lastTime) / 1000);
        
        if (elapsedSeconds > 0) {
          setLastUpdated(now);
          
          setTimers(prevTimers => {
            const newTimers = { ...prevTimers };
            let activeTaskFound = false;
            
            // Find the first non-completed task
            Object.keys(newTimers).some(taskId => {
              if (!completedTaskIds.includes(taskId) && !activeTaskFound) {
                activeTaskFound = true;
                // For focus tasks, continue counting into negative
                newTimers[taskId] = Math.max(newTimers[taskId] - elapsedSeconds, -999);
                return false;
              }
              return false;
            });
            
            return newTimers;
          });
        }
      }
    };
    
    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRoutineStarted, isPaused, lastUpdated, completedTaskIds]);

  // Timer countdown effect
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isRoutineStarted && !isPaused) {
      // Start a new interval
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        setLastUpdated(now);
        
        setTimers(prevTimers => {
          const newTimers = { ...prevTimers };
          let activeTaskFound = false;

          // Find the first non-completed task
          Object.keys(newTimers).some(taskId => {
            if (!completedTaskIds.includes(taskId) && !activeTaskFound) {
              activeTaskFound = true;
              // For focus tasks, continue counting into negative
              newTimers[taskId] = Math.max(newTimers[taskId] - 1, -999);
              return false;
            }
            return false;
          });

          return newTimers;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRoutineStarted, isPaused, completedTaskIds]);

  // Custom setter for pause state that also tracks pause timestamp
  const setPauseState = (paused: boolean) => {
    setIsPaused(paused);
    if (paused) {
      setPausedAt(Date.now());
    } else {
      setPausedAt(null);
      setLastUpdated(Date.now());
    }
  };

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (selectedRoutineId && isRoutineStarted) {
      const state: RoutineState = {
        isRoutineStarted,
        isPaused,
        timers,
        completedTaskIds,
        lastUpdated,
        pausedAt,
        cumulativeSpeedTaskDuration,
      };
      localStorage.setItem(`routineState_${selectedRoutineId}`, JSON.stringify(state));
    }
  }, [selectedRoutineId, isRoutineStarted, isPaused, timers, completedTaskIds, lastUpdated, pausedAt, cumulativeSpeedTaskDuration]);

  const resetRoutineState = () => {
    if (selectedRoutineId) {
      localStorage.removeItem(`routineState_${selectedRoutineId}`);
      localStorage.removeItem(`routine-${selectedRoutineId}-cumulative-time`);
      localStorage.removeItem(`routine-${selectedRoutineId}-speed-duration`);
      setIsRoutineStarted(false);
      setIsPaused(false);
      setTimers({});
      setCompletedTaskIds([]);
      setLastUpdated(Date.now());
      setPausedAt(null);
      setCumulativeTimeSaved(0);
      setCumulativeSpeedTaskDuration(0);
    }
  };

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
