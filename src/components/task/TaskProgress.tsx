import React from 'react';
import { Progress } from '@/components/ui/progress';

interface TaskProgressProps {
  timeLeft: number;
  duration: number;
}

const TaskProgress = ({ timeLeft, duration }: TaskProgressProps) => {
  const progressPercentage = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  return (
    <div className="mt-4">
      <Progress 
        value={progressPercentage} 
        className={`h-2 ${timeLeft < 0 ? 'bg-red-200' : ''}`}
      />
    </div>
  );
};

export default TaskProgress;