
import { useState, useEffect } from 'react';

interface RoutineState {
  isRoutineStarted: boolean;
  isPaused: boolean;
  timers: { [key: string]: number };
  completedTaskIds: string[];
}

export const useRoutineState = (selectedRoutineId: string | null) => {
  const [isRoutineStarted, setIsRoutineStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timers, setTimers] = useState<{ [key: string]: number }>({});
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);

  // Load state from localStorage when component mounts or routine changes
  useEffect(() => {
    if (selectedRoutineId) {
      const savedState = localStorage.getItem(`routineState_${selectedRoutineId}`);
      if (savedState) {
        const parsed = JSON.parse(savedState) as RoutineState;
        setIsRoutineStarted(parsed.isRoutineStarted);
        setIsPaused(parsed.isPaused || false);
        setTimers(parsed.timers);
        setCompletedTaskIds(parsed.completedTaskIds);
      } else {
        // Reset state if no saved state exists
        setIsRoutineStarted(false);
        setIsPaused(false);
        setTimers({});
        setCompletedTaskIds([]);
      }
    }
  }, [selectedRoutineId]);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRoutineStarted && !isPaused) {
      interval = setInterval(() => {
        setTimers(prevTimers => {
          const newTimers = { ...prevTimers };
          let activeTaskFound = false;

          // Find the first non-completed task
          Object.keys(newTimers).some(taskId => {
            if (!completedTaskIds.includes(taskId) && !activeTaskFound) {
              activeTaskFound = true;
              // For focus tasks, continue counting into negative
              newTimers[taskId] = newTimers[taskId] - 1;
              return false;
            }
            return false;
          });

          return newTimers;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRoutineStarted, isPaused, completedTaskIds]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (selectedRoutineId && isRoutineStarted) {
      const state: RoutineState = {
        isRoutineStarted,
        isPaused,
        timers,
        completedTaskIds,
      };
      localStorage.setItem(`routineState_${selectedRoutineId}`, JSON.stringify(state));
    }
  }, [selectedRoutineId, isRoutineStarted, isPaused, timers, completedTaskIds]);

  const resetRoutineState = () => {
    if (selectedRoutineId) {
      localStorage.removeItem(`routineState_${selectedRoutineId}`);
      setIsRoutineStarted(false);
      setIsPaused(false);
      setTimers({});
      setCompletedTaskIds([]);
    }
  };

  return {
    isRoutineStarted,
    setIsRoutineStarted,
    isPaused,
    setIsPaused,
    timers,
    setTimers,
    completedTaskIds,
    setCompletedTaskIds,
    resetRoutineState,
  };
};
