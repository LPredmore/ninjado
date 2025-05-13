
import React from 'react';
import { Button } from "@/components/ui/button";
import ProgressBar from './ProgressBar';
import { Play, Pause } from 'lucide-react';

interface RoutineProgressProps {
  routineTitle: string;
  completedTasks: number;
  totalTasks: number;
  isRoutineStarted: boolean;
  isPaused: boolean;
  onStartRoutine: () => void;
  onPauseRoutine: () => void;
}

const RoutineProgress = ({
  routineTitle,
  completedTasks,
  totalTasks,
  isRoutineStarted,
  isPaused,
  onStartRoutine,
  onPauseRoutine
}: RoutineProgressProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-ninja-text">
            {routineTitle} Progress
          </h2>
          <p className="text-sm text-gray-500">
            {completedTasks} of {totalTasks} tasks completed
          </p>
        </div>
        {!isRoutineStarted ? (
          <Button
            onClick={onStartRoutine}
            className="bg-ninja-primary text-white hover:bg-ninja-primary/90"
          >
            Start Routine
          </Button>
        ) : (
          <Button
            onClick={onPauseRoutine}
            variant="outline"
            className="flex items-center gap-1"
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            )}
          </Button>
        )}
      </div>
      <ProgressBar current={completedTasks} total={totalTasks} />
    </div>
  );
};

export default RoutineProgress;
