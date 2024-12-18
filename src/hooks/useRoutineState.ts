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