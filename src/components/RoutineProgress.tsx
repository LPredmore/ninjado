import React from 'react';
import { Button } from "@/components/ui/button";
import ProgressBar from './ProgressBar';

interface RoutineProgressProps {
  completedTasks: number;
  totalTasks: number;
  isRoutineStarted: boolean;
  onStartRoutine: () => void;
}

const RoutineProgress = ({
  completedTasks,
  totalTasks,
  isRoutineStarted,
  onStartRoutine
}: RoutineProgressProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-ninja-text">
            Morning Routine Progress
          </h2>
          <p className="text-sm text-gray-500">
            {completedTasks} of {totalTasks} tasks completed
          </p>
        </div>
        {!isRoutineStarted && (
          <Button
            onClick={onStartRoutine}
            className="bg-ninja-primary text-white hover:bg-ninja-primary/90"
          >
            Start Routine
          </Button>
        )}
      </div>
      <ProgressBar current={completedTasks} total={totalTasks} />
    </div>
  );
};

export default RoutineProgress;