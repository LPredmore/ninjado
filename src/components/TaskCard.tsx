import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    duration: number;
    isActive: boolean;
    isCompleted: boolean;
    timeLeft?: number;
  };
  onComplete: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isRoutineStarted: boolean;
}

const TaskCard = ({ 
  task, 
  onComplete, 
  onEdit, 
  onDelete, 
  isRoutineStarted 
}: TaskCardProps) => {
  const progressPercentage = task.timeLeft !== undefined 
    ? ((task.duration * 60 - task.timeLeft) / (task.duration * 60)) * 100
    : 0;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        "p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02]",
        "bg-white border-2",
        task.isActive ? "border-ninja-primary" : "border-gray-100",
        task.isCompleted && "opacity-50"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div
            className={cn(
              "p-3 rounded-full",
              task.isActive ? "bg-ninja-primary/10" : "bg-gray-100"
            )}
          >
            <Clock
              className={cn(
                "w-6 h-6",
                task.isActive ? "text-ninja-primary" : "text-gray-400"
              )}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-ninja-text">{task.title}</h3>
            <p className="text-sm text-gray-500">
              {task.timeLeft !== undefined && isRoutineStarted
                ? `${formatTime(task.timeLeft)} left`
                : `${task.duration} minutes`}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {task.isActive && !task.isCompleted && isRoutineStarted && (
            <Button
              onClick={onComplete}
              className="flex items-center space-x-2 bg-ninja-primary text-white hover:bg-ninja-primary/90"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Complete</span>
            </Button>
          )}
        </div>
      </div>
      
      {task.isActive && !task.isCompleted && task.timeLeft !== undefined && isRoutineStarted && (
        <div className="mt-4">
          <Progress value={progressPercentage} className="h-2" />
        </div>
      )}
    </div>
  );
};

export default TaskCard;