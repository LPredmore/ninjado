import React from 'react';
import { cn } from '@/lib/utils';
import TaskTimer from './task/TaskTimer';
import TaskProgress from './task/TaskProgress';
import TaskCompleteButton from './task/TaskCompleteButton';

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
  isRoutineStarted 
}: TaskCardProps) => {
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
        <TaskTimer
          timeLeft={task.timeLeft}
          duration={task.duration}
          isActive={task.isActive}
          isRoutineStarted={isRoutineStarted}
        />
        <div className="flex items-center space-x-2">
          {task.isActive && !task.isCompleted && isRoutineStarted && (
            <TaskCompleteButton onComplete={onComplete} />
          )}
        </div>
      </div>
      
      {task.isActive && !task.isCompleted && task.timeLeft !== undefined && isRoutineStarted && (
        <TaskProgress timeLeft={task.timeLeft} duration={task.duration} />
      )}
    </div>
  );
};

export default TaskCard;