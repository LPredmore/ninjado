import { useState, useEffect } from 'react';

interface RoutineState {
  isRoutineStarted: boolean;
  timers: { [key: string]: number };
  completedTaskIds: string[];
}

export const useRoutineState = (selectedRoutineId: string | null) => {
  const [isRoutineStarted, setIsRoutineStarted] = useState(false);
  const [timers, setTimers] = useState<{ [key: string]: number }>({});
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);

  // Load state from localStorage when component mounts or routine changes
  useEffect(() => {
    if (selectedRoutineId) {
      const savedState = localStorage.getItem(`routineState_${selectedRoutineId}`);
      if (savedState) {
        const parsed = JSON.parse(savedState) as RoutineState;
        setIsRoutineStarted(parsed.isRoutineStarted);
        setTimers(parsed.timers);
        setCompletedTaskIds(parsed.completedTaskIds);
      } else {
        // Reset state if no saved state exists
        setIsRoutineStarted(false);
        setTimers({});
        setCompletedTaskIds([]);
      }
    }
  }, [selectedRoutineId]);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRoutineStarted) {
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
  }, [isRoutineStarted, completedTaskIds]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (selectedRoutineId && isRoutineStarted) {
      const state: RoutineState = {
        isRoutineStarted,
        timers,
        completedTaskIds,
      };
      localStorage.setItem(`routineState_${selectedRoutineId}`, JSON.stringify(state));
    }
  }, [selectedRoutineId, isRoutineStarted, timers, completedTaskIds]);

  const resetRoutineState = () => {
    if (selectedRoutineId) {
      localStorage.removeItem(`routineState_${selectedRoutineId}`);
      setIsRoutineStarted(false);
      setTimers({});
      setCompletedTaskIds([]);
    }
  };

  return {
    isRoutineStarted,
    setIsRoutineStarted,
    timers,
    setTimers,
    completedTaskIds,
    setCompletedTaskIds,
    resetRoutineState,
  };
};