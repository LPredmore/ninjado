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
  onComplete: (timeSaved: number) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isRoutineStarted: boolean;
}

const TaskCard = ({ 
  task, 
  onComplete, 
  isRoutineStarted 
}: TaskCardProps) => {
  const handleComplete = () => {
    if (task.timeLeft !== undefined) {
      onComplete(task.duration * 60 - task.timeLeft);
    }
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
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
          <TaskTimer
            timeLeft={task.timeLeft}
            duration={task.duration}
            isActive={task.isActive}
            isRoutineStarted={isRoutineStarted}
          />
        </div>
        <div className="flex items-center space-x-2">
          {task.isActive && !task.isCompleted && isRoutineStarted && (
            <TaskCompleteButton onComplete={handleComplete} />
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