import React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskTimerProps {
  timeLeft?: number;
  duration: number;
  isActive: boolean;
  isRoutineStarted: boolean;
}

const TaskTimer = ({ timeLeft, duration, isActive, isRoutineStarted }: TaskTimerProps) => {
  const formatTime = (seconds: number) => {
    const isNegative = seconds < 0;
    const absoluteSeconds = Math.abs(seconds);
    const minutes = Math.floor(absoluteSeconds / 60);
    const remainingSeconds = absoluteSeconds % 60;
    return `${isNegative ? '-' : ''}${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="flex items-center space-x-4">
      <div
        className={cn(
          "p-3 rounded-full",
          isActive ? "bg-ninja-primary/10" : "bg-gray-100"
        )}
      >
        <Clock
          className={cn(
            "w-6 h-6",
            isActive ? "text-ninja-primary" : "text-gray-400"
          )}
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-ninja-text">Duration: {formatTime(duration * 60)}</h3>
        {timeLeft !== undefined && isRoutineStarted && (
          <p className={cn(
            "text-sm",
            timeLeft < 0 ? "text-red-500" : "text-gray-500"
          )}>
            Time remaining: {formatTime(timeLeft)}
          </p>
        )}
      </div>
    </div>
  );
};

export default TaskTimer;